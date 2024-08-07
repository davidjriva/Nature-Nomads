class APIFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  filter() {
    const queryObj = { ...this.queryStr };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];

    excludedFields.forEach((field) => delete queryObj[field]);

    // Advanced Filtering)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); // Turn operators to Mongo operators (gte --> $gte)

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.replaceAll(',', ' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.replaceAll(',', ' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); // excludes unnecessary fields from response
    }

    return this;
  }

  paginate() {
    const page = parseInt(this.queryStr.page) || 1;
    const limit = parseInt(this.queryStr.limit) || 100;
    const skipVal = (page - 1) * limit;
    this.query = this.query.skip(skipVal).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
