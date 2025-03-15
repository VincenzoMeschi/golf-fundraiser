// /app/api/cloudinary/delete/route.ts
import { NextResponse } from "next/server";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  const { publicId } = await request.json();

  if (!publicId) {
    return NextResponse.json({ error: "Public ID is required" }, { status: 400 });
  }

  console.log("Attempting to delete image with publicId:", publicId);

  try {
    const result = await cloudinary.v2.uploader.destroy(publicId, { invalidate: true });
    console.log("Cloudinary delete result:", result);
    if (result.result === "ok") {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: `Failed to delete image: ${result.result}` }, { status: 500 });
    }
  } catch (err) {
    console.error("Error deleting image from Cloudinary:", err);
    return NextResponse.json({ error: "Failed to delete image from Cloudinary" }, { status: 500 });
  }
}
