# Database Schema — Sahayak AI

## MongoDB Collections

### users
```js
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  passwordHash: String,
  role: "citizen" | "admin",
  language: "en" | "hi" | "gu",
  createdAt, updatedAt
}
```

### digital_twins
```js
{
  _id: ObjectId,
  userId: ObjectId (unique),
  age: Number,
  gender: String,
  state: String,
  district: String,
  education: String,
  occupation: String,
  incomeBand: String,
  categories: [String], // student, farmer, senior, woman, pwd, entrepreneur
  interests: [String],
  preferences: { notifications: Boolean, voiceEnabled: Boolean },
  createdAt, updatedAt
}
```

### documents
```js
{
  _id: ObjectId,
  userId: ObjectId,
  filename: String,
  originalName: String,
  mimeType: String,
  size: Number,
  storagePath: String,
  category: "aadhaar" | "pan" | "income" | "residence" | "caste" | "passport" | "letter" | "other",
  ocrText: String,
  extractedFields: Object,
  expiryDate: Date?,
  analysisSummary: String,
  status: "uploaded" | "analyzed" | "error",
  createdAt, updatedAt
}
```

### schemes
```js
{
  _id: ObjectId,
  name: String,
  slug: String,
  description: String,
  eligibility: [String],
  benefits: [String],
  requiredDocuments: [String],
  applicationProcess: [String],
  category: String,
  states: [String], // ["ALL"] or state codes
  targetGroups: [String],
  officialUrl: String,
  sourceRef: String,
  active: Boolean
}
```

### civic_reports
```js
{
  _id: ObjectId,
  userId: ObjectId,
  issueType: String,
  severity: "low" | "medium" | "high" | "critical",
  department: String,
  description: String,
  aiComplaintText: String,
  photoPath: String,
  location: { type: "Point", coordinates: [lng, lat] },
  status: "submitted" | "acknowledged" | "in_progress" | "resolved",
  trackingId: String,
  confidence: Number,
  createdAt, updatedAt
}
```

### chat_sessions
```js
{
  _id: ObjectId,
  userId: ObjectId,
  title: String,
  messages: [{ role, content, sources?, createdAt }],
  language: String,
  createdAt, updatedAt
}
```

### deadlines
```js
{
  _id: ObjectId,
  userId: ObjectId,
  title: String,
  type: "document_expiry" | "scholarship" | "subsidy" | "licence" | "custom",
  dueDate: Date,
  relatedDocumentId: ObjectId?,
  relatedSchemeId: ObjectId?,
  status: "upcoming" | "due_soon" | "overdue" | "done",
  reminderSent: Boolean,
  createdAt, updatedAt
}
```

### scam_analyses
```js
{
  _id: ObjectId,
  userId: ObjectId,
  text: String,
  channel: "sms" | "email" | "whatsapp" | "notice" | "other",
  label: "genuine" | "suspicious" | "fraudulent",
  confidence: Number,
  reasons: [String],
  createdAt
}
```

### opportunities
```js
{
  _id: ObjectId,
  title: String,
  type: "scholarship" | "internship" | "hackathon" | "job" | "grant" | "incubator" | "fellowship",
  description: String,
  eligibility: [String],
  deadline: Date?,
  url: String,
  targetGroups: [String],
  states: [String],
  active: Boolean
}
```

## Indexes
- `users.email` unique
- `digital_twins.userId` unique
- `documents.userId`
- `civic_reports.location` 2dsphere
- `deadlines.userId + dueDate`
- `schemes.category`, `schemes.targetGroups`

## ChromaDB
- Collection: `gov_knowledge`
- Metadata: `source`, `title`, `url`, `chunk_index`, `doc_type`
