class DevMediaCORSHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Apply CORS headers to media files only in development
        if request.path.startswith("/media/"):
            origin = request.headers.get("Origin")
            allowed_origins = [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:3001",
                "http://127.0.0.1:3001",
            ]

            if origin in allowed_origins:
                response["Access-Control-Allow-Origin"] = origin
                response["Access-Control-Allow-Credentials"] = "true"
        
        if request.path.startswith("/media/"):
            print(f"Adding CORS headers for media: {request.path}")

        return response
