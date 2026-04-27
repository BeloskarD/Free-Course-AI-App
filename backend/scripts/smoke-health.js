const baseUrl = process.env.BACKEND_BASE_URL || `http://127.0.0.1:${process.env.PORT || 5000}`;

const run = async () => {
  const [live, ready] = await Promise.all([
    fetch(`${baseUrl}/api/health/live`),
    fetch(`${baseUrl}/api/health/ready`),
  ]);

  const liveBody = await live.json();
  const readyBody = await ready.json();

  console.log(JSON.stringify({
    live: { status: live.status, body: liveBody },
    ready: { status: ready.status, body: readyBody },
  }, null, 2));

  if (!live.ok) {
    process.exit(1);
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
