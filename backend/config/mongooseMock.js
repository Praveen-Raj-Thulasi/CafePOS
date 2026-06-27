const { Pool } = require('pg');
const crypto = require('crypto');

// Mock ObjectId class to behave like MongoDB's ObjectId
class ObjectId {
  constructor(id) {
    if (id) {
      this.id = id.toString();
    } else {
      this.id = crypto.randomBytes(12).toString('hex');
    }
  }

  toString() {
    return this.id;
  }

  equals(other) {
    if (!other) return false;
    return this.toString() === other.toString();
  }
}

class Schema {
  constructor(definition, options) {
    this.definition = definition;
    this.options = options;
    this.methods = {};
    this.preHooks = {};
  }

  pre(hookName, fn) {
    this.preHooks = this.preHooks || {};
    this.preHooks[hookName] = fn;
  }

  index(fields, options) {
    // No-op for mock index setup
  }
}
Schema.Types = {
  ObjectId: ObjectId,
  Mixed: {}
};

class Document {
  constructor(data, modelClass) {
    Object.assign(this, data);
    Object.defineProperty(this, '_modelClass', { value: modelClass, enumerable: false });
    
    // Bind schema methods
    if (modelClass.schema && modelClass.schema.methods) {
      for (const [name, fn] of Object.entries(modelClass.schema.methods)) {
        this[name] = fn.bind(this);
      }
    }
  }

  isModified(path) {
    return true;
  }

  async save() {
    const schema = this._modelClass.schema;
    if (schema && schema.preHooks && schema.preHooks['save']) {
      await new Promise((resolve, reject) => {
        schema.preHooks['save'].call(this, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    const plainData = { ...this };
    if (!plainData._id) {
      plainData._id = this._modelClass.generateId();
    } else if (plainData._id instanceof ObjectId) {
      plainData._id = plainData._id.toString();
    }

    const collection = this._modelClass.collectionName;
    const query = `
      INSERT INTO documents (id, collection, data) 
      VALUES ($1, $2, $3)
      ON CONFLICT (id) 
      DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP
      RETURNING data;
    `;
    const res = await this._modelClass.pool.query(query, [plainData._id.toString(), collection, JSON.stringify(plainData)]);
    Object.assign(this, res.rows[0].data);
    return this;
  }

  async deleteOne() {
    const id = this._id;
    if (id) {
      const collection = this._modelClass.collectionName;
      await this._modelClass.pool.query('DELETE FROM documents WHERE id = $1 AND collection = $2', [id.toString(), collection]);
    }
    return { deletedCount: 1 };
  }
}

function matchMongoQuery(doc, query) {
  if (!query || Object.keys(query).length === 0) return true;
  for (const [key, val] of Object.entries(query)) {
    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof ObjectId)) {
      const operators = Object.keys(val);
      if (operators.some(op => op.startsWith('$'))) {
        for (const [op, opVal] of Object.entries(val)) {
          const docVal = doc[key];
          if (op === '$in') {
            const list = Array.isArray(opVal) ? opVal.map(x => x.toString()) : [];
            const docValStr = docVal ? (Array.isArray(docVal) ? docVal.map(x => x.toString()) : [docVal.toString()]) : [];
            if (!docValStr.some(x => list.includes(x))) return false;
          } else if (op === '$exists') {
            const exists = (docVal !== undefined && docVal !== null);
            if (exists !== !!opVal) return false;
          } else if (op === '$gte') {
            if (!(docVal >= opVal)) return false;
          } else if (op === '$lte') {
            if (!(docVal <= opVal)) return false;
          } else if (op === '$gt') {
            if (!(docVal > opVal)) return false;
          } else if (op === '$lt') {
            if (!(docVal < opVal)) return false;
          } else if (op === '$ne') {
            if (docVal?.toString() === opVal?.toString()) return false;
          }
        }
        continue;
      }
    }

    const docVal = doc[key];
    if (docVal === undefined || docVal === null) {
      if (val !== null && val !== undefined) return false;
    } else if (val === null || val === undefined) {
      if (docVal !== null && docVal !== undefined) return false;
    } else if (Array.isArray(docVal)) {
      if (!docVal.map(x => x.toString()).includes(val.toString())) return false;
    } else {
      if (docVal.toString() !== val.toString()) return false;
    }
  }
  return true;
}

function sortDocs(docs, sortOption) {
  if (typeof sortOption === 'string') {
    const order = sortOption.startsWith('-') ? -1 : 1;
    const field = sortOption.replace(/^[+-]/, '');
    return [...docs].sort((a, b) => {
      const va = a[field];
      const vb = b[field];
      if (va < vb) return -1 * order;
      if (va > vb) return 1 * order;
      return 0;
    });
  } else if (typeof sortOption === 'object' && sortOption !== null) {
    const fields = Object.entries(sortOption);
    return [...docs].sort((a, b) => {
      for (const [field, order] of fields) {
        const va = a[field];
        const vb = b[field];
        const dir = order === -1 || order === 'desc' ? -1 : 1;
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
      }
      return 0;
    });
  }
  return docs;
}

function updateDoc(doc, updateObj) {
  const setVal = updateObj.$set || updateObj;
  for (const [key, val] of Object.entries(setVal)) {
    doc[key] = val;
  }
  if (updateObj.$inc) {
    for (const [key, val] of Object.entries(updateObj.$inc)) {
      doc[key] = (doc[key] || 0) + val;
    }
  }
  return doc;
}

function filterFields(doc, selectFields) {
  if (!doc) return null;
  if (!selectFields || selectFields.length === 0) return doc;
  const filtered = {};
  const isExclude = selectFields.some(f => f.startsWith('-'));
  if (isExclude) {
    const excludeSet = new Set(selectFields.map(f => f.replace(/^-/, '')));
    for (const [k, v] of Object.entries(doc)) {
      if (!excludeSet.has(k)) filtered[k] = v;
    }
  } else {
    const includeSet = new Set(selectFields);
    includeSet.add('_id');
    for (const [k, v] of Object.entries(doc)) {
      if (includeSet.has(k)) filtered[k] = v;
    }
  }
  return filtered;
}

class Query {
  constructor(modelClass, queryOptions, isFindMany = true) {
    this.modelClass = modelClass;
    this.queryOptions = queryOptions;
    this.isFindMany = isFindMany;
    this.populatePaths = [];
    this.sortOption = null;
    this.limitVal = null;
    this.isLean = false;
  }

  populate(path, select) {
    this.populatePaths.push({ path, select });
    return this;
  }

  sort(options) {
    this.sortOption = options;
    return this;
  }

  limit(val) {
    this.limitVal = val;
    return this;
  }

  lean() {
    this.isLean = true;
    return this;
  }

  async then(resolve, reject) {
    try {
      const result = await this.exec();
      resolve(result);
    } catch (err) {
      reject(err);
    }
  }

  async exec() {
    const collection = this.modelClass.collectionName;
    const res = await this.modelClass.pool.query('SELECT data FROM documents WHERE collection = $1', [collection]);
    let docs = res.rows.map(r => r.data);

    docs = docs.filter(doc => matchMongoQuery(doc, this.queryOptions));

    if (this.sortOption) {
      docs = sortDocs(docs, this.sortOption);
    }

    if (this.limitVal !== null) {
      docs = docs.slice(0, this.limitVal);
    }

    if (!this.isLean) {
      docs = docs.map(d => new Document(d, this.modelClass));
    }

    if (this.populatePaths.length > 0) {
      for (const p of this.populatePaths) {
        await this.populateDoc(docs, p);
      }
    }

    if (!this.isFindMany) {
      return docs[0] || null;
    }
    return docs;
  }

  async populateDoc(docs, popOption) {
    let paths = [];
    let nested = null;
    let select = popOption.select;

    if (typeof popOption.path === 'string') {
      paths = popOption.path.split(' ');
    } else if (typeof popOption.path === 'object' && popOption.path !== null) {
      paths = [popOption.path.path];
      nested = popOption.path.populate;
    }

    for (const path of paths) {
      const schemaField = this.modelClass.schema.definition[path];
      let refModelName = null;
      if (schemaField) {
        if (schemaField.ref) {
          refModelName = schemaField.ref;
        } else if (Array.isArray(schemaField) && schemaField[0] && schemaField[0].ref) {
          refModelName = schemaField[0].ref;
        } else if (schemaField.type && schemaField.type.ref) {
          refModelName = schemaField.type.ref;
        }
      }

      if (!refModelName) {
        const fallbacks = {
          table: 'Table',
          product: 'Product',
          category: 'Category',
          openedBy: 'User',
          closedBy: 'User',
          targetProduct: 'Product',
          order: 'Order',
          user: 'User',
          customer: 'User'
        };
        refModelName = fallbacks[path];
      }

      if (!refModelName) continue;

      const refModel = this.modelClass.mongoose.model(refModelName);
      if (!refModel) continue;

      const idsToFetch = new Set();
      for (const doc of docs) {
        const val = doc[path];
        if (val) {
          if (Array.isArray(val)) {
            val.forEach(id => idsToFetch.add(id.toString()));
          } else {
            idsToFetch.add(val.toString());
          }
        }
      }

      if (idsToFetch.size === 0) continue;

      const refDocs = await refModel.find({ _id: { $in: Array.from(idsToFetch) } }).lean();
      const refMap = new Map(refDocs.map(d => [d._id.toString(), d]));

      let selectFields = null;
      if (typeof select === 'string') {
        selectFields = select.split(' ');
      }

      for (const doc of docs) {
        const val = doc[path];
        if (val) {
          if (Array.isArray(val)) {
            doc[path] = val.map(id => filterFields(refMap.get(id.toString()) || null, selectFields));
          } else {
            doc[path] = filterFields(refMap.get(val.toString()) || null, selectFields);
          }
        }
      }

      if (nested) {
        const childDocs = [];
        for (const doc of docs) {
          const val = doc[path];
          if (val) {
            if (Array.isArray(val)) childDocs.push(...val);
            else childDocs.push(val);
          }
        }
        if (childDocs.length > 0) {
          const childQuery = new Query(refModel, {}, true);
          await childQuery.populateDoc(childDocs, { path: nested });
        }
      }
    }
  }
}

let pool = null;
const models = {};

const mongoose = {
  connection: {
    host: 'localhost',
    on: (event, callback) => {}
  },

  connect: async (uri) => {
    let pgUri = uri;
    // Map connection string if MongoDB string is provided
    if (uri.startsWith('mongodb')) {
      pgUri = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/odoocafe?sslmode=disable';
    }

    pool = new Pool({
      connectionString: pgUri,
      ssl: process.env.NODE_ENV === 'production' || pgUri.includes('amazonaws.com') ? { rejectUnauthorized: false } : false
    });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(50) PRIMARY KEY,
        collection VARCHAR(50) NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_documents_collection ON documents(collection);`);
    
    mongoose.connection.host = pool.options.host || 'postgres';
    return mongoose;
  },

  disconnect: async () => {
    if (pool) await pool.end();
  },

  Schema: Schema,
  Types: {
    ObjectId: ObjectId
  },

  model: (name, schema) => {
    if (models[name]) return models[name];
    if (!schema) throw new Error(`Model ${name} not found.`);

    const collectionName = name.toLowerCase();

    class DynamicModel extends Document {
      constructor(data) {
        super(data, DynamicModel);
      }

      static schema = schema;
      static collectionName = collectionName;
      static mongoose = mongoose;

      static get collection() {
        return {
          insertMany: (arr) => this.insertMany(arr)
        };
      }

      static get pool() {
        return pool;
      }

      static generateId() {
        return new ObjectId().toString();
      }

      static async create(docData) {
        const doc = new this(docData);
        await doc.save();
        return doc;
      }

      static find(query) {
        return new Query(DynamicModel, query, true);
      }

      static findOne(query) {
        return new Query(DynamicModel, query, false);
      }

      static async findById(id) {
        if (!id) return null;
        return new Query(DynamicModel, { _id: id.toString() }, false);
      }

      static async countDocuments(query) {
        const q = new Query(DynamicModel, query, true);
        const res = await q.exec();
        return res.length;
      }

      static async distinct(field, query) {
        const q = new Query(DynamicModel, query, true);
        const res = await q.exec();
        const vals = res.map(doc => doc[field]);
        return Array.from(new Set(vals.filter(v => v !== undefined)));
      }

      static async updateOne(query, update) {
        const doc = await this.findOne(query);
        if (!doc) return { matchedCount: 0, modifiedCount: 0 };
        const updated = updateDoc(doc, update);
        await updated.save();
        return { matchedCount: 1, modifiedCount: 1 };
      }

      static async updateMany(query, update) {
        const docs = await this.find(query);
        for (const doc of docs) {
          const updated = updateDoc(doc, update);
          await updated.save();
        }
        return { matchedCount: docs.length, modifiedCount: docs.length };
      }

      static async deleteMany(query = {}) {
        if (Object.keys(query).length === 0) {
          await pool.query('DELETE FROM documents WHERE collection = $1', [collectionName]);
          return { deletedCount: 999 };
        }
        const docs = await this.find(query);
        for (const doc of docs) {
          await doc.deleteOne();
        }
        return { deletedCount: docs.length };
      }

      static async findByIdAndUpdate(id, update, options = {}) {
        const doc = await this.findById(id);
        if (!doc) return null;
        const updated = updateDoc(doc, update);
        await updated.save();
        return updated;
      }

      static async insertMany(arr) {
        const docs = [];
        for (const item of arr) {
          const doc = new this(item);
          await doc.save();
          docs.push(doc);
        }
        return docs;
      }
    }

    models[name] = DynamicModel;
    return DynamicModel;
  }
};

module.exports = mongoose;
