class ApiResponse {
    constructor(statusCode,data,message='Success'){
        this.statusCode = statusCode,
        this.data = data,
        this.message = message
        this.success = statusCode
    }
}

export default ApiResponse;

// in big companies we get a spec sheet or memo for mapping the statuscode with response



// statusCode < 400 for success 

/* 

HTTP STATUS CODE

1.Information responses (100-199)
2. Successful responses (200-299)
3. Redirection responses (300-399)
4. Client error responses (400-499)
5. Server error responses (500-599)


*/