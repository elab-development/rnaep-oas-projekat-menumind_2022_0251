export async function uploadImage(file: File): Promise<string> {
  const signRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/cloudinary/sign`,
    {
      method: "POST",
      credentials: "include",
    },
  );
  if (!signRes.ok) throw new Error("Failed to get upload signature");
  const { timestamp, signature, cloudName, apiKey, folder } =
    await signRes.json();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );
  if (!uploadRes.ok) throw new Error("Upload failed");

  const data = await uploadRes.json();
  return data.secure_url as string;
}
