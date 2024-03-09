function structuredError(res, error){
    return res.status(error.statusCode).json({ message: error.message });
}

export {
    structuredError
}