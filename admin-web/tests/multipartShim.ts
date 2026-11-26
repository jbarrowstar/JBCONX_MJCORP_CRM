/**
 * TEST ENVIRONMENT ONLY. happy-dom's FormData serializer omits the closing boundary, drops binary bytes and
 * ignores filenames, so file uploads from the simulated DOM would be corrupt. This shim remembers the bytes of
 * every Blob/File at construction time and re-encodes FormData bodies as a correct multipart message.
 * Real browsers and the Android WebView do not need (or use) any of this.
 */
const bytesOf = new WeakMap<object, Uint8Array>();
const enc = new TextEncoder();

const toBytes = (part: unknown): Uint8Array => {
  if (part instanceof Uint8Array) return part;
  if (part instanceof ArrayBuffer) return new Uint8Array(part);
  if (typeof part === 'string') return enc.encode(part);
  if (part && typeof part === 'object' && bytesOf.has(part as object)) return bytesOf.get(part as object)!;
  return enc.encode(String(part));
};
const concat = (chunks: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
};

const RealBlob = globalThis.Blob;
const RealFile = globalThis.File;
class TrackedBlob extends RealBlob {
  constructor(parts: unknown[] = [], options?: BlobPropertyBag) {
    super(parts as BlobPart[], options);
    bytesOf.set(this, concat(parts.map(toBytes)));
  }
}
class TrackedFile extends RealFile {
  constructor(parts: unknown[], name: string, options?: FilePropertyBag) {
    super(parts as BlobPart[], name, options);
    bytesOf.set(this, concat(parts.map(toBytes)));
  }
}
globalThis.Blob = TrackedBlob as unknown as typeof Blob;
globalThis.File = TrackedFile as unknown as typeof File;

// FormData.append(name, blob, filename) stores a NEW File object: carry the remembered bytes over to it.
const carry = (fd: FormData, name: string, value: unknown) => {
  if (value && typeof value === 'object' && bytesOf.has(value as object)) {
    const stored = fd.getAll(name).at(-1);
    if (stored && typeof stored === 'object') bytesOf.set(stored as object, bytesOf.get(value as object)!);
  }
};
const realAppend = FormData.prototype.append;
FormData.prototype.append = function (this: FormData, name: string, value: string | Blob, filename?: string) {
  (realAppend as (n: string, v: unknown, f?: string) => void).call(this, name, value, filename);
  carry(this, name, value);
} as typeof FormData.prototype.append;
const realSet = FormData.prototype.set;
FormData.prototype.set = function (this: FormData, name: string, value: string | Blob, filename?: string) {
  (realSet as (n: string, v: unknown, f?: string) => void).call(this, name, value, filename);
  carry(this, name, value);
} as typeof FormData.prototype.set;

const encodeForm = (fd: FormData): { body: Uint8Array; contentType: string } => {
  const boundary = `----jbconxtest${Math.random().toString(36).slice(2)}`;
  const chunks: Uint8Array[] = [];
  for (const [name, value] of (fd as unknown as { entries(): Iterable<[string, FormDataEntryValue]> }).entries()) {
    if (typeof value === 'string') {
      chunks.push(enc.encode(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
    } else {
      const file = value as File;
      chunks.push(enc.encode(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"; filename="${file.name || 'blob'}"\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`));
      chunks.push(bytesOf.get(file) ?? new Uint8Array());
      chunks.push(enc.encode('\r\n'));
    }
  }
  chunks.push(enc.encode(`--${boundary}--\r\n`));
  return { body: concat(chunks), contentType: `multipart/form-data; boundary=${boundary}` };
};

const fixInit = (init?: RequestInit): RequestInit | undefined => {
  if (!init?.body || !(init.body instanceof FormData)) return init;
  const { body, contentType } = encodeForm(init.body);
  const headers = new Headers(init.headers);
  headers.set('content-type', contentType);
  return { ...init, body, headers };
};

const RealRequest = globalThis.Request;
globalThis.Request = class extends RealRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, fixInit(init));
  }
} as unknown as typeof Request;
