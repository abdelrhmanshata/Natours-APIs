class APIFeatures {
  constructor(query, queryString) {
    this.query = query; // The Mongoose query object
    this.queryString = queryString; // The query parameters from the request
  }

  filter() {
    // Create a copy of the query string object to avoid modifying the original
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields']; // Fields to exclude from the filter
    excludedFields.forEach((el) => delete queryObj[el]); // Remove excluded fields

    // Convert query object to string, replace operators with MongoDB equivalents
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // Parse the modified query string back to an object and apply it to the query
    this.query = this.query.find(JSON.parse(queryStr));

    return this; // Return the instance for method chaining
  }

  sort() {
    if (this.queryString.sort) {
      // If sort parameter exists, parse it and apply sorting
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      // Default sorting by creation date in descending order
      this.query = this.query.sort('-createdAt');
    }

    return this; // Return the instance for method chaining
  }

  limitFields() {
    if (this.queryString.fields) {
      // If fields parameter exists, parse it and apply field selection
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // Default field selection, exclude the version field
      this.query = this.query.select('-__v');
    }

    return this; // Return the instance for method chaining
  }

  paginate() {
    // Set default page and limit values, calculate skip value for pagination
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    // Apply skip and limit to the query
    this.query = this.query.skip(skip).limit(limit);

    return this; // Return the instance for method chaining
  }
}

module.exports = APIFeatures;
