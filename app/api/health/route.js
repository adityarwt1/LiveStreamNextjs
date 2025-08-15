export async function GET() {
  try {
    return Response.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "livestream-platform",
    })
  } catch (error) {
    return Response.json(
      {
        status: "unhealthy",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
