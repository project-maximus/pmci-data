import { neon } from "@neondatabase/serverless";
import { loadEnvFromFile } from "./env.mjs";

const CONTENT = [
  {
    title: "Program Orientation & Foundations",
    subsections: [
      "Welcome to Performance Masters Career Institute",
      "AMCA Accreditation Overview",
      "Pearson Testing Site Guidelines",
      "Student Handbook & Academic Policies",
      "Campus Resources & Student Support Services",
      "Financial Aid & Enrollment Information",
    ],
  },
  {
    title: "EKG Technician Program",
    subsections: [
      "Cardiac Anatomy & Physiology",
      "Basic EKG Concepts & Waveforms",
      "Lead Placement & 12-Lead EKG Setup",
      "Normal Sinus Rhythm Identification",
      "Common Arrhythmias & Recognition",
      "EKG Equipment Maintenance & Troubleshooting",
      "Patient Preparation & Communication",
      "EKG Documentation & Reporting",
      "AMCA EKG Technician Certification Exam Prep",
    ],
  },
  {
    title: "Medical Administrative Assistant (MAAC)",
    subsections: [
      "Medical Office Procedures & Workflow",
      "Patient Registration & Scheduling",
      "Electronic Health Records (EHR) Systems",
      "Medical Records Management & Privacy",
      "HIPAA Compliance & Patient Confidentiality",
      "Insurance Verification & Prior Authorization",
      "Medical Billing & Claims Processing",
      "Medical Coding Introduction (ICD-10 & CPT)",
      "Professional Communication in Healthcare",
      "AMCA MAAC Certification Exam Prep",
    ],
  },
  {
    title: "Mental Health Technician (MHTC)",
    subsections: [
      "Introduction to Mental Health Care",
      "Common Mental Health Conditions & Diagnoses",
      "Patient Observation & Safety Monitoring",
      "De-escalation & Crisis Intervention Techniques",
      "Therapeutic Communication Skills",
      "Mental Health Laws, Ethics & Patient Rights",
      "Documentation in Behavioral Health Settings",
      "Working with Multidisciplinary Teams",
      "AMCA MHTC Certification Exam Prep",
    ],
  },
  {
    title: "Nursing Assistant (NAC / CNA)",
    subsections: [
      "Nursing Assistant Role & Scope of Practice",
      "Infection Control & Standard Precautions",
      "Basic Patient Care Skills & Personal Hygiene",
      "Vital Signs Measurement & Reporting",
      "Mobility Assistance & Body Mechanics",
      "Nutrition, Hydration & Feeding Assistance",
      "Long-Term Care & Geriatric Considerations",
      "Patient Rights & Dignity in Care",
      "CNA Documentation & Nurse Communication",
      "CNA State Certification Exam Prep",
    ],
  },
  {
    title: "Medical Assistant Program",
    subsections: [
      "Medical Assisting Scope of Practice",
      "Clinical Procedures & Sterile Technique",
      "Phlebotomy & Blood Collection in Medical Assisting",
      "Medication Administration & Pharmacology Basics",
      "EKG Performance in Clinical Settings",
      "Front Office & Administrative Functions",
      "Medical Law & Healthcare Ethics",
      "CMA / RMA Certification Exam Prep",
    ],
  },
  {
    title: "Medical Billing & Coding",
    subsections: [
      "Introduction to Medical Coding",
      "ICD-10-CM Diagnosis Coding",
      "CPT Procedure Coding",
      "HCPCS Level II Coding",
      "Medical Billing Workflow & Claim Submission",
      "Insurance & Reimbursement Methodologies",
      "HIPAA Compliance in Billing",
      "Medical Terminology for Coders",
      "Revenue Cycle Management Basics",
      "CPC / CCA Certification Exam Prep",
    ],
  },
  {
    title: "Phlebotomy Training",
    subsections: [
      "Introduction to Phlebotomy & Lab Role",
      "Blood Collection Equipment & Supplies",
      "Venipuncture Technique & Best Practices",
      "Capillary & Fingerstick Collection",
      "Difficult Draws & Special Populations",
      "Specimen Labeling, Handling & Transport",
      "Quality Assurance & Error Prevention",
      "Infection Control & Needle Safety",
      "Patient Interaction & Communication",
      "Phlebotomy Certification Exam Prep",
    ],
  },
  {
    title: "Career Services & Clinical Externship",
    subsections: [
      "Clinical Externship Guidelines & Expectations",
      "Professional Conduct in Healthcare Settings",
      "Resume Building & Portfolio Development",
      "Interview Preparation & Job Search Strategies",
      "Job Placement Resources & Employer Contacts",
      "Continuing Education & Career Advancement",
      "Professional Healthcare Organizations",
    ],
  },
  {
    title: "Admin & Operations Hub",
    subsections: [
      "Content Management Dashboard",
      "Student & Enrollment Management",
      "Instructor Resources & Curriculum Tools",
      "Assessment & Exam Administration",
      "Video & Media Library Management",
      "Scheduling & Calendar System",
      "Analytics & Student Progress Tracking",
      "System Settings & Security Controls",
    ],
  },
];

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

async function main() {
  loadEnvFromFile();

  const connectionString = process.env.NEON_DB;
  if (!connectionString) {
    throw new Error("NEON_DB is missing. Add it to .env and retry.");
  }

  const sql = neon(connectionString);

  await sql`
    CREATE TABLE IF NOT EXISTS content_sections (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      sort_order INT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS content_subsections (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      section_id BIGINT NOT NULL REFERENCES content_sections(id) ON DELETE CASCADE,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      sort_order INT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS content_resources (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      subsection_id BIGINT NOT NULL REFERENCES content_subsections(id) ON DELETE CASCADE,
      resource_type TEXT NOT NULL CHECK (
        resource_type IN (
          'study_notes',
          'audio',
          'video',
          'review_questions',
          'references',
          'worksheet',
          'other'
        )
      ),
      source_mode TEXT NOT NULL DEFAULT 'drive_link' CHECK (source_mode IN ('drive_link', 'ai_generated')),
      drive_url TEXT,
      ai_note TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'not_submitted' CHECK (status IN ('not_submitted', 'resubmit', 'done')),
      created_by TEXT NOT NULL,
      updated_by TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  /* Add notes column for existing tables */
  await sql`
    ALTER TABLE content_resources
    ADD COLUMN IF NOT EXISTS notes TEXT
  `;

  /* Add unique constraint to prevent duplicate resource types per subsection */
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_subsection_resource
    ON content_resources (subsection_id, resource_type)
  `;

  /* Add index on subsection_id for faster lookups */
  await sql`
    CREATE INDEX IF NOT EXISTS idx_resources_subsection
    ON content_resources (subsection_id)
  `;

  /* Add index on subsections.section_id for faster joins */
  await sql`
    CREATE INDEX IF NOT EXISTS idx_subsections_section
    ON content_subsections (section_id)
  `;

  for (let sectionIndex = 0; sectionIndex < CONTENT.length; sectionIndex += 1) {
    const section = CONTENT[sectionIndex];
    const sectionCode = `section-${sectionIndex + 1}-${slugify(section.title)}`;

    await sql`
      INSERT INTO content_sections (code, title, sort_order, updated_at)
      VALUES (${sectionCode}, ${section.title}, ${sectionIndex + 1}, NOW())
      ON CONFLICT (code)
      DO UPDATE SET
        title = EXCLUDED.title,
        sort_order = EXCLUDED.sort_order,
        updated_at = NOW()
    `;

    const sectionRows = await sql`
      SELECT id FROM content_sections WHERE code = ${sectionCode} LIMIT 1
    `;

    const sectionId = sectionRows[0]?.id;

    for (let subsectionIndex = 0; subsectionIndex < section.subsections.length; subsectionIndex += 1) {
      const subsectionTitle = section.subsections[subsectionIndex];
      const subsectionCode = `sub-${sectionIndex + 1}-${subsectionIndex + 1}-${slugify(subsectionTitle)}`;

      await sql`
        INSERT INTO content_subsections (section_id, code, title, sort_order, updated_at)
        VALUES (${sectionId}, ${subsectionCode}, ${subsectionTitle}, ${subsectionIndex + 1}, NOW())
        ON CONFLICT (code)
        DO UPDATE SET
          section_id = EXCLUDED.section_id,
          title = EXCLUDED.title,
          sort_order = EXCLUDED.sort_order,
          updated_at = NOW()
      `;
    }
  }

  console.log("Content tables are ready and PMCI program hierarchy is seeded.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
