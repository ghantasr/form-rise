-- 20 additional community templates (slugs ≤ 12 chars, safe to re-run)
-- Run: docker exec -i formrise-postgres-1 psql -U formflow -d formflow < scripts/seed-templates-extra.sql

DO $$
DECLARE
  seed_user_id UUID := '00000000-0000-0000-0000-000000000001';
  f UUID;
BEGIN

INSERT INTO "Users" ("Id","Email","DisplayName","IsVerified","CreatedAt","UpdatedAt")
VALUES (seed_user_id,'templates@formrise.fyi','FormRise Templates',TRUE,NOW(),NOW())
ON CONFLICT ("Email") DO NOTHING;

-- ── 11. Product Waitlist ──────────────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'waitlist','Product Waitlist',
  'Be the first to know when we launch. Join the waitlist today.','active',TRUE,TRUE,
  TRUE,FALSE,FALSE,FALSE,'You are on the list! We will email you the moment we go live.',0,0,NOW(),NOW())
ON CONFLICT ("Slug") DO NOTHING;
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','Full name','Jane Smith',TRUE,0,NOW()),
  (gen_random_uuid(),f,'email','Email address','you@example.com',TRUE,1,NOW()),
  (gen_random_uuid(),f,'short_text','Job title / role','e.g. Product Manager',FALSE,2,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'radio','How did you hear about us?',FALSE,3,
   '["Twitter / X","LinkedIn","Friend / colleague","Blog post","Search engine","Other"]',NOW()),
  (gen_random_uuid(),f,'checkbox','What features matter most to you?',FALSE,4,
   '["Fast onboarding","Team collaboration","Integrations","Analytics","Mobile app","API access"]',NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'long_text','Anything specific you are hoping for?',FALSE,5,NOW());

-- ── 12. Lead Generation ───────────────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'leadgen','Lead Generation',
  'Tell us about your business and we will reach out with a tailored solution.','active',TRUE,TRUE,
  TRUE,FALSE,FALSE,TRUE,'Great, we will be in touch within 1 business day!',0,0,NOW(),NOW())
ON CONFLICT ("Slug") DO NOTHING;
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','Full name','Jane Smith',TRUE,0,NOW()),
  (gen_random_uuid(),f,'email','Work email','you@company.com',TRUE,1,NOW()),
  (gen_random_uuid(),f,'short_text','Company name','Acme Inc.',TRUE,2,NOW()),
  (gen_random_uuid(),f,'short_text','Phone number','+1 555 000 0000',FALSE,3,NOW()),
  (gen_random_uuid(),f,'url','Company website','https://acme.com',FALSE,4,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'dropdown','Company size',TRUE,5,
   '["1–10","11–50","51–200","201–500","500+"]',NOW()),
  (gen_random_uuid(),f,'dropdown','Industry',FALSE,6,
   '["Technology","Healthcare","Finance","Education","Retail","Manufacturing","Other"]',NOW()),
  (gen_random_uuid(),f,'radio','Budget range',FALSE,7,
   '["Under $1k/mo","$1k–$5k/mo","$5k–$20k/mo","$20k+/mo","Not sure yet"]',NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'long_text','What challenge are you trying to solve?',TRUE,8,NOW());

-- ── 13. IT Support Ticket ─────────────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'itsupport','IT Support Ticket',
  'Submit a support request and our IT team will respond promptly.','active',TRUE,FALSE,
  TRUE,FALSE,FALSE,TRUE,'Ticket submitted! You will receive an email with your ticket number.',0,0,NOW(),NOW())
ON CONFLICT ("Slug") DO NOTHING;
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','Your name','Jane Smith',TRUE,0,NOW()),
  (gen_random_uuid(),f,'email','Email address','you@company.com',TRUE,1,NOW()),
  (gen_random_uuid(),f,'short_text','Issue summary','e.g. Cannot access shared drive',TRUE,2,NOW()),
  (gen_random_uuid(),f,'long_text','Full description of the problem','Describe what happened, when it started, and what you have tried...',TRUE,4,NOW()),
  (gen_random_uuid(),f,'short_text','Asset tag / device ID','e.g. LAPTOP-042',FALSE,6,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'radio','Priority',TRUE,3,
   '["Critical — work stopped","High — major impact","Medium — workaround exists","Low — minor inconvenience"]',NOW()),
  (gen_random_uuid(),f,'dropdown','Category',TRUE,5,
   '["Hardware","Software","Network / VPN","Email / Calendar","Accounts & Access","Other"]',NOW());

-- ── 14. User Research Interview ───────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'userresrch','User Research Sign-up',
  'Help us build a better product. Sign up for a 30-minute research interview.','active',TRUE,TRUE,
  TRUE,FALSE,FALSE,TRUE,'Thank you! We will reach out to schedule your session.',0,0,NOW(),NOW())
ON CONFLICT ("Slug") DO NOTHING;
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','Full name','Jane Smith',TRUE,0,NOW()),
  (gen_random_uuid(),f,'email','Email address','you@example.com',TRUE,1,NOW()),
  (gen_random_uuid(),f,'short_text','Job title','Product Designer',FALSE,2,NOW()),
  (gen_random_uuid(),f,'number','How long have you used our product? (months)','6',FALSE,4,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'radio','How often do you use our product?',TRUE,3,
   '["Daily","A few times a week","Once a week","A few times a month","Rarely"]',NOW()),
  (gen_random_uuid(),f,'checkbox','Preferred interview format',TRUE,5,
   '["Video call (Zoom/Meet)","Phone call","In-person (if local)"]',NOW()),
  (gen_random_uuid(),f,'checkbox','Best times for you (UTC)',FALSE,6,
   '["Mon–Fri morning","Mon–Fri afternoon","Mon–Fri evening","Weekends"]',NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'long_text','What is your biggest frustration with the product today?',FALSE,7,NOW());

-- ── 15. Patient Intake Form ───────────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'patientform','Patient Intake Form',
  'Please complete before your appointment. Your information is kept confidential.','active',TRUE,FALSE,
  TRUE,FALSE,FALSE,TRUE,'Form received. See you at your appointment!',0,0,NOW(),NOW())
ON CONFLICT ("Slug") DO NOTHING;
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','Full name','Jane Smith',TRUE,0,NOW()),
  (gen_random_uuid(),f,'date','Date of birth',NULL,TRUE,1,NOW()),
  (gen_random_uuid(),f,'email','Email address','you@example.com',FALSE,2,NOW()),
  (gen_random_uuid(),f,'short_text','Phone number','+1 555 000 0000',TRUE,3,NOW()),
  (gen_random_uuid(),f,'short_text','Emergency contact name','John Smith',FALSE,5,NOW()),
  (gen_random_uuid(),f,'short_text','Emergency contact phone','+1 555 000 0001',FALSE,6,NOW()),
  (gen_random_uuid(),f,'long_text','Current medications (list all)','Include dosage if known',FALSE,8,NOW()),
  (gen_random_uuid(),f,'long_text','Allergies','Food, medication, environmental...',FALSE,9,NOW()),
  (gen_random_uuid(),f,'long_text','Reason for visit','Describe your symptoms or concerns',TRUE,10,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'dropdown','Insurance provider',FALSE,4,
   '["Aetna","Blue Cross Blue Shield","Cigna","Humana","Medicare","Medicaid","UnitedHealth","Self-pay","Other"]',NOW()),
  (gen_random_uuid(),f,'radio','Have you visited us before?',TRUE,7,
   '["Yes","No"]',NOW());

-- ── 16. Scholarship Application ───────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'scholarship','Scholarship Application',
  'Apply for our annual scholarship. All eligible students are encouraged to apply.','active',TRUE,FALSE,
  TRUE,FALSE,FALSE,TRUE,'Application submitted! Results will be announced within 4 weeks.',0,0,NOW(),NOW())
ON CONFLICT ("Slug") DO NOTHING;
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','Full name','Jane Smith',TRUE,0,NOW()),
  (gen_random_uuid(),f,'email','Email address','you@university.edu',TRUE,1,NOW()),
  (gen_random_uuid(),f,'short_text','University / institution','State University',TRUE,2,NOW()),
  (gen_random_uuid(),f,'short_text','Field of study','Computer Science',TRUE,3,NOW()),
  (gen_random_uuid(),f,'number','Current GPA (out of 4.0)','3.5',TRUE,5,NOW()),
  (gen_random_uuid(),f,'long_text','Personal statement (500 words max)','Tell us about yourself, your goals, and why you deserve this scholarship...',TRUE,7,NOW()),
  (gen_random_uuid(),f,'long_text','Financial need statement',NULL,FALSE,8,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'dropdown','Year of study',TRUE,4,
   '["1st year","2nd year","3rd year","4th year","Postgraduate"]',NOW()),
  (gen_random_uuid(),f,'radio','Are you the first in your family to attend university?',FALSE,6,
   '["Yes","No","Prefer not to say"]',NOW());

-- ── 17. Pet Adoption Application ─────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'petadopt','Pet Adoption Application',
  'Help us find the perfect match. Complete this form and we will be in touch within 48 hours.','active',TRUE,TRUE,
  TRUE,FALSE,FALSE,TRUE,'Application received! Our team will review it and contact you soon.',0,0,NOW(),NOW())
ON CONFLICT ("Slug") DO NOTHING;
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','Full name','Jane Smith',TRUE,0,NOW()),
  (gen_random_uuid(),f,'email','Email address','you@example.com',TRUE,1,NOW()),
  (gen_random_uuid(),f,'short_text','Phone number','+1 555 000 0000',TRUE,2,NOW()),
  (gen_random_uuid(),f,'short_text','Home address (city, state)','Austin, TX',TRUE,3,NOW()),
  (gen_random_uuid(),f,'short_text','Pet you are interested in','e.g. Golden Retriever #A-142',TRUE,4,NOW()),
  (gen_random_uuid(),f,'long_text','Tell us about your home environment','e.g. house with yard, apartment, other pets...',TRUE,7,NOW()),
  (gen_random_uuid(),f,'long_text','Previous pet experience',NULL,FALSE,8,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'radio','Type of home',TRUE,5,
   '["House with yard","House without yard","Apartment","Condo","Other"]',NOW()),
  (gen_random_uuid(),f,'radio','Do you have children at home?',FALSE,6,
   '["Yes, under 5","Yes, 5–12","Yes, 13+","No"]',NOW()),
  (gen_random_uuid(),f,'checkbox','Other pets currently at home',FALSE,9,
   '["Dog","Cat","Small animal","Bird","Fish","None"]',NOW());

-- ── 18. Rental Application ────────────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'rentalapp','Rental Application',
  'Apply for a rental property. We process applications within 2 business days.','active',TRUE,FALSE,
  TRUE,FALSE,FALSE,TRUE,'Application submitted! We will review and contact you shortly.',0,0,NOW(),NOW())
ON CONFLICT ("Slug") DO NOTHING;
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','Full legal name','Jane Smith',TRUE,0,NOW()),
  (gen_random_uuid(),f,'date','Date of birth',NULL,TRUE,1,NOW()),
  (gen_random_uuid(),f,'email','Email address','you@example.com',TRUE,2,NOW()),
  (gen_random_uuid(),f,'short_text','Phone number','+1 555 000 0000',TRUE,3,NOW()),
  (gen_random_uuid(),f,'short_text','Current address','123 Main St, City, State',TRUE,4,NOW()),
  (gen_random_uuid(),f,'short_text','Current employer','Acme Inc.',FALSE,5,NOW()),
  (gen_random_uuid(),f,'number','Monthly gross income ($)','5000',TRUE,6,NOW()),
  (gen_random_uuid(),f,'short_text','Emergency contact name','John Smith',FALSE,8,NOW()),
  (gen_random_uuid(),f,'short_text','Emergency contact phone','+1 555 000 0001',FALSE,9,NOW()),
  (gen_random_uuid(),f,'long_text','Additional notes / special requests',NULL,FALSE,11,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'radio','Do you have pets?',TRUE,7,
   '["No","Yes — cat","Yes — dog","Yes — other"]',NOW()),
  (gen_random_uuid(),f,'radio','Do you smoke?',TRUE,10,
   '["No","Yes"]',NOW());

-- ── 19. Return & Refund Request ───────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'returnrefnd','Return & Refund',
  'Initiate a return or refund request. We process requests within 3–5 business days.','active',TRUE,TRUE,
  TRUE,FALSE,FALSE,TRUE,'Request received! Check your email for next steps.',0,0,NOW(),NOW())
ON CONFLICT ("Slug") DO NOTHING;
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','Full name','Jane Smith',TRUE,0,NOW()),
  (gen_random_uuid(),f,'email','Email address (used for order)','you@example.com',TRUE,1,NOW()),
  (gen_random_uuid(),f,'short_text','Order number','#ORD-00123',TRUE,2,NOW()),
  (gen_random_uuid(),f,'short_text','Product name / SKU','Blue T-Shirt - Size M',TRUE,3,NOW()),
  (gen_random_uuid(),f,'date','Date of purchase',NULL,TRUE,4,NOW()),
  (gen_random_uuid(),f,'long_text','Describe the issue','What is wrong with the product?',TRUE,6,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'radio','Return reason',TRUE,5,
   '["Defective / damaged","Wrong item sent","Does not match description","Changed my mind","Other"]',NOW()),
  (gen_random_uuid(),f,'radio','Preferred resolution',TRUE,7,
   '["Full refund","Exchange for same item","Exchange for different item","Store credit"]',NOW());

-- ── 20. Conference Speaker Proposal ──────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'speakerprop','Speaker Proposal',
  'Submit a talk proposal for our upcoming conference. We accept proposals on a rolling basis.','active',TRUE,TRUE,
  TRUE,FALSE,FALSE,TRUE,'Proposal received! The program committee will review it within 3 weeks.',0,0,NOW(),NOW())
ON CONFLICT ("Slug") DO NOTHING;
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','Speaker name','Jane Smith',TRUE,0,NOW()),
  (gen_random_uuid(),f,'email','Email address','you@example.com',TRUE,1,NOW()),
  (gen_random_uuid(),f,'short_text','Job title & company','Staff Engineer @ Acme',FALSE,2,NOW()),
  (gen_random_uuid(),f,'url','Speaker bio / website','https://',FALSE,3,NOW()),
  (gen_random_uuid(),f,'url','Twitter / X handle','https://twitter.com/',FALSE,4,NOW()),
  (gen_random_uuid(),f,'short_text','Talk title','e.g. Scaling to 10M users on $0',TRUE,5,NOW()),
  (gen_random_uuid(),f,'long_text','Talk abstract (300 words max)','What is the talk about and what will attendees learn?',TRUE,7,NOW()),
  (gen_random_uuid(),f,'long_text','Speaker bio (150 words max)',NULL,TRUE,9,NOW()),
  (gen_random_uuid(),f,'url','Previous talk recording (if any)','https://youtube.com/',FALSE,10,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'radio','Talk format',TRUE,6,
   '["30-min talk","45-min talk","60-min workshop","Lightning talk (10 min)"]',NOW()),
  (gen_random_uuid(),f,'radio','Talk level',TRUE,8,
   '["Beginner","Intermediate","Advanced"]',NOW());

-- ── 21. Vendor Registration ───────────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'vendorreg','Vendor Registration',
  'Register as an approved vendor. Our procurement team will review your submission.','active',TRUE,FALSE,
  TRUE,FALSE,FALSE,TRUE,'Registration received! Our procurement team will contact you within 5 days.',0,0,NOW(),NOW())
ON CONFLICT ("Slug") DO NOTHING;
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','Company name','Acme Supplies Ltd.',TRUE,0,NOW()),
  (gen_random_uuid(),f,'short_text','Contact person','Jane Smith',TRUE,1,NOW()),
  (gen_random_uuid(),f,'email','Business email','procurement@acme.com',TRUE,2,NOW()),
  (gen_random_uuid(),f,'short_text','Phone number','+1 555 000 0000',TRUE,3,NOW()),
  (gen_random_uuid(),f,'url','Company website','https://acme.com',FALSE,4,NOW()),
  (gen_random_uuid(),f,'short_text','Tax ID / VAT number','US12-3456789',FALSE,6,NOW()),
  (gen_random_uuid(),f,'long_text','Products or services offered','Describe what you supply...',TRUE,8,NOW()),
  (gen_random_uuid(),f,'long_text','References (2–3 companies you currently supply)',NULL,FALSE,9,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'dropdown','Business type',TRUE,5,
   '["Sole trader","LLC / Ltd","Corporation","Partnership","Non-profit","Other"]',NOW()),
  (gen_random_uuid(),f,'checkbox','Certifications held',FALSE,7,
   '["ISO 9001","ISO 27001","SOC 2","PCI DSS","GDPR compliant","None"]',NOW());

-- ── 22. Newsletter Preferences ────────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'newsletter','Newsletter Sign-up',
  'Stay in the loop. Choose what you want to hear about.','active',TRUE,TRUE,
  TRUE,FALSE,FALSE,FALSE,'You are subscribed! Check your inbox for a welcome email.',0,0,NOW(),NOW())
ON CONFLICT ("Slug") DO NOTHING;
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','First name','Jane',FALSE,0,NOW()),
  (gen_random_uuid(),f,'email','Email address','you@example.com',TRUE,1,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'checkbox','Topics of interest',FALSE,2,
   '["Product updates","Industry news","Tutorials & how-tos","Case studies","Events & webinars","Deals & offers"]',NOW()),
  (gen_random_uuid(),f,'radio','How often would you like to hear from us?',FALSE,3,
   '["Daily","Weekly","Bi-weekly","Monthly"]',NOW());

-- ── 23. Gym Membership ────────────────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'gymregform','Gym Membership',
  'Join our gym. Fill in your details and we will get your membership activated within 24 hours.','active',TRUE,TRUE,
  TRUE,FALSE,FALSE,TRUE,'Welcome! Your membership is being processed. See you at the gym!',0,0,NOW(),NOW())
ON CONFLICT ("Slug") DO NOTHING;
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','Full name','Jane Smith',TRUE,0,NOW()),
  (gen_random_uuid(),f,'date','Date of birth',NULL,TRUE,1,NOW()),
  (gen_random_uuid(),f,'email','Email address','you@example.com',TRUE,2,NOW()),
  (gen_random_uuid(),f,'short_text','Phone number','+1 555 000 0000',TRUE,3,NOW()),
  (gen_random_uuid(),f,'short_text','Emergency contact & phone','John Smith — +1 555 000 0001',TRUE,5,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'radio','Membership plan',TRUE,4,
   '["Monthly","Quarterly","Annual","Day pass"]',NOW()),
  (gen_random_uuid(),f,'checkbox','Facilities you plan to use',FALSE,6,
   '["Weights","Cardio machines","Swimming pool","Group classes","Personal training","Sauna"]',NOW()),
  (gen_random_uuid(),f,'radio','Fitness goal',FALSE,7,
   '["Weight loss","Muscle building","General fitness","Sports performance","Rehabilitation","Other"]',NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'long_text','Any injuries or medical conditions we should know about?',FALSE,8,NOW());

-- ── 24. Course Enrollment ─────────────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'courseenrol','Course Enrollment',
  'Enroll in one of our upcoming courses. Spots are limited — secure yours today.','active',TRUE,TRUE,
  TRUE,FALSE,FALSE,TRUE,'Enrollment confirmed! Check your inbox for joining instructions.',0,0,NOW(),NOW())
ON CONFLICT ("Slug") DO NOTHING;
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','Full name','Jane Smith',TRUE,0,NOW()),
  (gen_random_uuid(),f,'email','Email address','you@example.com',TRUE,1,NOW()),
  (gen_random_uuid(),f,'short_text','Phone number','+1 555 000 0000',FALSE,2,NOW()),
  (gen_random_uuid(),f,'long_text','What do you hope to get out of this course?',NULL,FALSE,6,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'dropdown','Course',TRUE,3,
   '["Web Development Bootcamp","Data Science Fundamentals","UI/UX Design","Digital Marketing","Product Management","Other"]',NOW()),
  (gen_random_uuid(),f,'radio','Your current level',TRUE,4,
   '["Complete beginner","Some experience","Intermediate","Advanced"]',NOW()),
  (gen_random_uuid(),f,'radio','Preferred format',FALSE,5,
   '["Live online","On-demand video","In-person","Hybrid"]',NOW());

-- ── 25. Parent-Teacher Meeting ────────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'ptmeeting','Parent-Teacher Meeting',
  'Book a meeting with your child''s teacher. Slots are 15 minutes each.','active',TRUE,FALSE,
  TRUE,FALSE,FALSE,FALSE,'Meeting booked! You will receive a confirmation email with the time and location.',0,0,NOW(),NOW())
ON CONFLICT ("Slug") DO NOTHING;
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','Parent / guardian name','Jane Smith',TRUE,0,NOW()),
  (gen_random_uuid(),f,'email','Email address','you@example.com',TRUE,1,NOW()),
  (gen_random_uuid(),f,'short_text','Phone number','+1 555 000 0000',FALSE,2,NOW()),
  (gen_random_uuid(),f,'short_text','Child''s name','Alex Smith',TRUE,3,NOW()),
  (gen_random_uuid(),f,'short_text','Child''s class / year','Year 5 — Mrs Johnson',TRUE,4,NOW()),
  (gen_random_uuid(),f,'long_text','Topics you would like to discuss',NULL,FALSE,7,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'radio','Preferred date',TRUE,5,
   '["Monday 15 April","Tuesday 16 April","Wednesday 17 April","Thursday 18 April"]',NOW()),
  (gen_random_uuid(),f,'radio','Preferred time slot',TRUE,6,
   '["9:00–9:15 AM","9:15–9:30 AM","3:30–3:45 PM","3:45–4:00 PM","4:00–4:15 PM"]',NOW());

-- ── 26. Travel Booking Request ────────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'travelbook','Travel Request Form',
  'Submit a travel booking request. Our travel desk will confirm within 1 business day.','active',TRUE,FALSE,
  TRUE,FALSE,FALSE,TRUE,'Travel request submitted! Our team will send you an itinerary shortly.',0,0,NOW(),NOW())
ON CONFLICT ("Slug") DO NOTHING;
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','Traveller name','Jane Smith',TRUE,0,NOW()),
  (gen_random_uuid(),f,'email','Email address','you@company.com',TRUE,1,NOW()),
  (gen_random_uuid(),f,'short_text','Departure city','New York',TRUE,2,NOW()),
  (gen_random_uuid(),f,'short_text','Destination city','London',TRUE,3,NOW()),
  (gen_random_uuid(),f,'date','Departure date',NULL,TRUE,4,NOW()),
  (gen_random_uuid(),f,'date','Return date',NULL,TRUE,5,NOW()),
  (gen_random_uuid(),f,'short_text','Purpose of trip','e.g. Client meeting — Acme Inc.',TRUE,7,NOW()),
  (gen_random_uuid(),f,'number','Estimated total budget ($)',NULL,FALSE,9,NOW()),
  (gen_random_uuid(),f,'long_text','Special requests or notes','e.g. window seat, dietary requirements...',FALSE,10,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'radio','Number of travellers',TRUE,6,
   '["1","2","3","4","5+"]',NOW()),
  (gen_random_uuid(),f,'checkbox','Booking required for',TRUE,8,
   '["Flights","Hotel","Car hire","Train / rail","Airport transfer"]',NOW());

-- ── 27. Volunteer Sign-Up ─────────────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'volunteersup','Volunteer Sign-Up',
  'Join our volunteer programme and make a difference in the community.','active',TRUE,TRUE,
  TRUE,FALSE,FALSE,TRUE,'Thank you for signing up! Our coordinator will contact you within 3 days.',0,0,NOW(),NOW())
ON CONFLICT ("Slug") DO NOTHING;
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','Full name','Jane Smith',TRUE,0,NOW()),
  (gen_random_uuid(),f,'email','Email address','you@example.com',TRUE,1,NOW()),
  (gen_random_uuid(),f,'short_text','Phone number','+1 555 000 0000',FALSE,2,NOW()),
  (gen_random_uuid(),f,'short_text','City / town','Austin, TX',FALSE,3,NOW()),
  (gen_random_uuid(),f,'long_text','Tell us about yourself and why you want to volunteer',NULL,TRUE,6,NOW()),
  (gen_random_uuid(),f,'long_text','Any relevant skills or experience?',NULL,FALSE,7,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'checkbox','Areas you are interested in',TRUE,4,
   '["Teaching / tutoring","Food distribution","Environmental clean-up","Elderly care","Animal welfare","Events & admin","Fundraising"]',NOW()),
  (gen_random_uuid(),f,'radio','Availability',TRUE,5,
   '["Weekday mornings","Weekday afternoons","Evenings","Weekends","Flexible"]',NOW());

-- ── 28. Product Review ────────────────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'productrvw','Product Review',
  'Share your experience with the product. Takes under 2 minutes.','active',TRUE,TRUE,
  FALSE,FALSE,FALSE,FALSE,'Review submitted — thank you! Your feedback helps other customers.',0,0,NOW(),NOW())
ON CONFLICT ("Slug") DO NOTHING;
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','Product name / model','e.g. Wireless Headphones Pro',TRUE,0,NOW()),
  (gen_random_uuid(),f,'short_text','Review title','e.g. Great sound, average battery',TRUE,2,NOW()),
  (gen_random_uuid(),f,'long_text','Your full review',NULL,TRUE,3,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'rating','Overall rating (1–5)',TRUE,1,NULL,NOW()),
  (gen_random_uuid(),f,'radio','Would you recommend this product?',TRUE,4,
   '["Definitely","Probably","Not sure","Probably not","No"]',NOW()),
  (gen_random_uuid(),f,'radio','How long have you used this product?',FALSE,5,
   '["Less than a week","1–4 weeks","1–3 months","3–12 months","Over a year"]',NOW()),
  (gen_random_uuid(),f,'checkbox','What did you like?',FALSE,6,
   '["Build quality","Performance","Value for money","Design","Ease of use","Customer support"]',NOW()),
  (gen_random_uuid(),f,'checkbox','What could be improved?',FALSE,7,
   '["Build quality","Performance","Value for money","Design","Ease of use","Documentation"]',NOW());

-- ── 29. School Admission Enquiry ──────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'schooladmn','School Admission Enquiry',
  'Interested in enrolling your child? Submit an enquiry and our admissions team will be in touch.','active',TRUE,TRUE,
  TRUE,FALSE,FALSE,TRUE,'Enquiry received! Our admissions team will contact you within 2 business days.',0,0,NOW(),NOW())
ON CONFLICT ("Slug") DO NOTHING;
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','Parent / guardian name','Jane Smith',TRUE,0,NOW()),
  (gen_random_uuid(),f,'email','Email address','you@example.com',TRUE,1,NOW()),
  (gen_random_uuid(),f,'short_text','Phone number','+1 555 000 0000',TRUE,2,NOW()),
  (gen_random_uuid(),f,'short_text','Child''s full name','Alex Smith',TRUE,3,NOW()),
  (gen_random_uuid(),f,'date','Child''s date of birth',NULL,TRUE,4,NOW()),
  (gen_random_uuid(),f,'long_text','Any additional information (special needs, language support, etc.)',NULL,FALSE,7,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'dropdown','Applying for year / grade',TRUE,5,
   '["Pre-K / Reception","Year 1 / Grade 1","Year 2 / Grade 2","Year 3 / Grade 3","Year 4 / Grade 4","Year 5 / Grade 5","Year 6 / Grade 6","Secondary / Middle school"]',NOW()),
  (gen_random_uuid(),f,'radio','Intended start date',TRUE,6,
   '["September (this year)","January (next term)","September (next year)","As soon as possible"]',NOW());

-- ── 30. Website Design Brief ──────────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'designbrief','Website Design Brief',
  'Tell us about your project so we can prepare a tailored proposal.','active',TRUE,TRUE,
  TRUE,FALSE,FALSE,TRUE,'Brief received! We will send a proposal within 3 business days.',0,0,NOW(),NOW())
ON CONFLICT ("Slug") DO NOTHING;
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','Your name','Jane Smith',TRUE,0,NOW()),
  (gen_random_uuid(),f,'email','Email address','you@example.com',TRUE,1,NOW()),
  (gen_random_uuid(),f,'short_text','Company / project name','Acme Inc.',FALSE,2,NOW()),
  (gen_random_uuid(),f,'url','Existing website (if any)','https://',FALSE,3,NOW()),
  (gen_random_uuid(),f,'long_text','Describe your business in a few sentences',NULL,TRUE,4,NOW()),
  (gen_random_uuid(),f,'long_text','What is the goal of the new website?','e.g. generate leads, sell products, build brand...',TRUE,5,NOW()),
  (gen_random_uuid(),f,'long_text','Websites you admire and why','Share 2–3 URLs and what you like about them',FALSE,8,NOW()),
  (gen_random_uuid(),f,'long_text','Any other requirements or notes',NULL,FALSE,10,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'radio','Budget range',FALSE,6,
   '["Under $2k","$2k–$5k","$5k–$15k","$15k–$50k","$50k+","Not decided yet"]',NOW()),
  (gen_random_uuid(),f,'radio','Timeline',TRUE,7,
   '["ASAP — under 4 weeks","1–2 months","3–6 months","6+ months","Flexible"]',NOW()),
  (gen_random_uuid(),f,'checkbox','Pages / features needed',FALSE,9,
   '["Home","About","Services / Products","Blog","Contact","E-commerce","Booking / scheduling","Member portal","Multilingual"]',NOW());

END $$;
