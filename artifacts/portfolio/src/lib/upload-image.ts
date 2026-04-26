async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

export type UploadPurpose = "post_cover" | "project_image" | "generic";

export async function uploadImage(
  file: File,
  purpose: UploadPurpose = "generic",
): Promise<string> {
  const dataUrl = await fileToDataUrl(file);

  const response = await fetch("/api/uploads", {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      filename: file.name,
      dataUrl,
      purpose,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { url?: string; error?: string }
    | null;

  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error ?? `Upload failed (${response.status})`);
  }

  return payload.url;
}
