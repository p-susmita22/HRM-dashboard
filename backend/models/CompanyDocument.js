import mongoose from 'mongoose';

const companyDocumentSchema = new mongoose.Schema({
  docType: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  fileName: { type: String, required: true }
}, { timestamps: true });

const CompanyDocument = mongoose.model('CompanyDocument', companyDocumentSchema);
export default CompanyDocument;
