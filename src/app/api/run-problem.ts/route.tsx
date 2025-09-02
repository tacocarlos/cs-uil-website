export async function GET(
  request: Request,
  { params }: { params: Promise<{}> },
) {
  await params;
  return new Response("Test", {
    status: 200,
  });
}
