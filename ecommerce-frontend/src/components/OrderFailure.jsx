function OrderFailure() {
  return (
    <div className="max-w-xl mx-auto p-6 text-center bg-white rounded shadow mt-10">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Payment Failed</h1>
      <p className="text-gray-700 mb-2">Sorry, your payment could not be completed.</p>
      <a href="/checkout" className="mt-4 inline-block text-blue-600 underline">
        Try Again
      </a>
    </div>
  );
}

export default OrderFailure;
