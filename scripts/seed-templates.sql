-- Seed community templates
-- Run: docker exec -i form-builder-postgres-1 psql -U formflow formflow < scripts/seed-templates.sql

DO $$
DECLARE
  seed_user_id UUID := '00000000-0000-0000-0000-000000000001';
  f UUID;
BEGIN

INSERT INTO "Users" ("Id","Email","DisplayName","IsVerified","CreatedAt","UpdatedAt")
VALUES (seed_user_id,'templates@formflow.app','FormFlow Templates',TRUE,NOW(),NOW())
ON CONFLICT ("Email") DO NOTHING;

-- ── 1. Customer Feedback ─────────────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'custfeedback','Customer Feedback',
  'Help us improve by sharing your experience.','active',TRUE,TRUE,
  FALSE,FALSE,FALSE,TRUE,'Thank you for your feedback! It means a lot to us.',0,0,NOW(),NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'rating','How would you rate your overall experience?',TRUE,0,NULL,NOW()),
  (gen_random_uuid(),f,'radio','How did you hear about us?',FALSE,1,
   '["Social media","Friend/family","Search engine","Advertisement","Other"]',NOW()),
  (gen_random_uuid(),f,'long_text','What did you like most?',FALSE,2,NULL,NOW()),
  (gen_random_uuid(),f,'long_text','What could we improve?',FALSE,3,NULL,NOW()),
  (gen_random_uuid(),f,'radio','Would you recommend us to others?',TRUE,4,
   '["Definitely","Probably","Not sure","Probably not","Definitely not"]',NOW());

-- ── 2. Event Registration ────────────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'eventreg','Event Registration',
  'Register for our upcoming event. Limited spots available.','active',TRUE,TRUE,
  TRUE,FALSE,FALSE,TRUE,'You are registered! We will send confirmation to your email.',0,0,NOW(),NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','Full name','Jane Smith',TRUE,0,NOW()),
  (gen_random_uuid(),f,'email','Email address','you@example.com',TRUE,1,NOW()),
  (gen_random_uuid(),f,'short_text','Phone number','+91 98765 43210',FALSE,2,NOW()),
  (gen_random_uuid(),f,'short_text','Organisation','Company / College',FALSE,3,NOW()),
  (gen_random_uuid(),f,'date','Preferred date',NULL,TRUE,4,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'dropdown','Ticket type',TRUE,5,'["General","VIP","Student (with ID)"]',NOW()),
  (gen_random_uuid(),f,'checkbox','Dietary requirements',FALSE,6,
   '["Vegetarian","Vegan","Gluten-free","Halal","No restrictions"]',NOW());

-- ── 3. Job Application ───────────────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'jobapply','Job Application',
  'Apply for an open position at our company.','active',TRUE,FALSE,
  TRUE,FALSE,FALSE,TRUE,'Application received! We will review it within 5 business days.',0,0,NOW(),NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','Full name','Jane Smith',TRUE,0,NOW()),
  (gen_random_uuid(),f,'email','Email address','you@example.com',TRUE,1,NOW()),
  (gen_random_uuid(),f,'url','LinkedIn profile','https://linkedin.com/in/...',FALSE,3,NOW()),
  (gen_random_uuid(),f,'url','Portfolio / GitHub','https://',FALSE,4,NOW()),
  (gen_random_uuid(),f,'number','Years of experience','3',TRUE,5,NOW()),
  (gen_random_uuid(),f,'long_text','Why do you want to join us?',NULL,TRUE,6,NOW()),
  (gen_random_uuid(),f,'long_text','Tell us about a challenging project',NULL,FALSE,7,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'dropdown','Position applying for',TRUE,2,
   '["Software Engineer","Product Manager","Designer","Marketing","Sales","Other"]',NOW()),
  (gen_random_uuid(),f,'radio','When can you start?',TRUE,8,
   '["Immediately","Within 2 weeks","Within 1 month","More than 1 month"]',NOW());

-- ── 4. Bug Report ────────────────────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'bugreport','Bug Report',
  'Found something broken? Let us know so we can fix it fast.','active',TRUE,TRUE,
  FALSE,FALSE,FALSE,TRUE,'Bug reported — thank you! Our team will investigate.',0,0,NOW(),NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','Short summary','e.g. Login button does nothing',TRUE,0,NOW()),
  (gen_random_uuid(),f,'long_text','Steps to reproduce','Step 1: ...',TRUE,1,NOW()),
  (gen_random_uuid(),f,'long_text','Expected behaviour',NULL,FALSE,2,NOW()),
  (gen_random_uuid(),f,'long_text','Actual behaviour',NULL,FALSE,3,NOW()),
  (gen_random_uuid(),f,'short_text','Browser / device','Chrome 120, macOS',FALSE,5,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'radio','Severity',TRUE,4,
   '["Critical — app is unusable","High — major feature broken","Medium — workaround exists","Low — cosmetic"]',NOW());

-- ── 5. Contact Us ────────────────────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'contactus','Contact Us',
  'Get in touch with our team. We respond within 24 hours.','active',TRUE,TRUE,
  TRUE,FALSE,FALSE,TRUE,'Message received! We will get back to you within 24 hours.',0,0,NOW(),NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','Your name','Jane Smith',TRUE,0,NOW()),
  (gen_random_uuid(),f,'email','Email address','you@example.com',TRUE,1,NOW()),
  (gen_random_uuid(),f,'long_text','Message','How can we help you?',TRUE,3,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'dropdown','Topic',TRUE,2,
   '["General enquiry","Sales","Support","Partnership","Press","Other"]',NOW());

-- ── 6. Employee Satisfaction Survey ─────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'empsurvey','Employee Satisfaction Survey',
  'Anonymous quarterly check-in. Your honest input shapes our culture.','active',TRUE,TRUE,
  FALSE,FALSE,FALSE,TRUE,'Thank you! Your response is completely anonymous.',0,0,NOW(),NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'rating','Overall job satisfaction (1–5)',TRUE,0,NULL,NOW()),
  (gen_random_uuid(),f,'rating','Work-life balance (1–5)',TRUE,1,NULL,NOW()),
  (gen_random_uuid(),f,'rating','Team collaboration (1–5)',TRUE,2,NULL,NOW()),
  (gen_random_uuid(),f,'radio','Do you feel your work is valued?',TRUE,3,
   '["Always","Often","Sometimes","Rarely","Never"]',NOW()),
  (gen_random_uuid(),f,'radio','Would you recommend working here?',TRUE,4,
   '["Definitely","Probably","Not sure","Probably not","No"]',NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'long_text','What is working well?',FALSE,5,NOW()),
  (gen_random_uuid(),f,'long_text','What should we change?',FALSE,6,NOW());

-- ── 7. Feature Request ───────────────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'featurereq','Feature Request',
  'Help shape our product roadmap. Tell us what you need.','active',TRUE,TRUE,
  FALSE,FALSE,FALSE,TRUE,'Feature request submitted! We review every single one.',0,0,NOW(),NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','Feature title','e.g. Dark mode',TRUE,0,NOW()),
  (gen_random_uuid(),f,'long_text','Describe the problem this solves',NULL,TRUE,1,NOW()),
  (gen_random_uuid(),f,'long_text','Describe your ideal solution',NULL,FALSE,2,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'radio','How important is this?',TRUE,3,
   '["Must have","Nice to have","Just an idea"]',NOW()),
  (gen_random_uuid(),f,'radio','How often does this affect you?',FALSE,4,
   '["Daily","Weekly","Monthly","Rarely"]',NOW());

-- ── 8. Workshop Registration ─────────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'workshopreg','Workshop Registration',
  'Reserve your spot for our hands-on workshop.','active',TRUE,TRUE,
  TRUE,FALSE,FALSE,TRUE,'Spot reserved! Check your email for joining details.',0,0,NOW(),NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","Placeholder","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'short_text','Full name','Jane Smith',TRUE,0,NOW()),
  (gen_random_uuid(),f,'email','Email address','you@example.com',TRUE,1,NOW()),
  (gen_random_uuid(),f,'short_text','Job title','e.g. Developer',FALSE,2,NOW()),
  (gen_random_uuid(),f,'short_text','Company / college',NULL,FALSE,3,NOW()),
  (gen_random_uuid(),f,'number','Team size (if group)',NULL,FALSE,5,NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'radio','Experience level',TRUE,4,'["Beginner","Intermediate","Advanced"]',NOW()),
  (gen_random_uuid(),f,'checkbox','Topics of interest',FALSE,6,
   '["Fundamentals","Hands-on practice","Case studies","Q&A with experts","Networking"]',NOW());

-- ── 9. NPS Survey ────────────────────────────────────────────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'npssurvey','NPS Survey',
  'Quick 3-question survey. Takes less than a minute.','active',TRUE,TRUE,
  FALSE,FALSE,FALSE,TRUE,'Thanks for your score! It helps us improve every day.',0,0,NOW(),NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'rating','Likelihood to recommend us (1=low, 5=high)',TRUE,0,NULL,NOW()),
  (gen_random_uuid(),f,'radio','Primary reason for your score',FALSE,1,
   '["Product quality","Customer support","Pricing","Ease of use","Speed","Other"]',NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'long_text','Anything else you would like to share?',FALSE,2,NOW());

-- ── 10. Restaurant Table Feedback (perfect for QR codes) ─────
f := gen_random_uuid();
INSERT INTO "Forms"("Id","UserId","Slug","Title","Description","Status","IsPublic","AllowAnonymous",
  "CollectEmail","LimitOneResponse","ShuffleFields","ShowProgress","ThankYouMsg","ForkCount","ResponseCount","CreatedAt","UpdatedAt")
VALUES(f,seed_user_id,'tablefdbck','Table Feedback',
  'Scan the QR on your table to rate your dining experience.','active',TRUE,TRUE,
  FALSE,FALSE,FALSE,TRUE,'Thank you! Your feedback helps us serve you better.',0,0,NOW(),NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","Options","CreatedAt") VALUES
  (gen_random_uuid(),f,'rating','Food quality (1–5)',TRUE,0,NULL,NOW()),
  (gen_random_uuid(),f,'rating','Service (1–5)',TRUE,1,NULL,NOW()),
  (gen_random_uuid(),f,'rating','Ambience (1–5)',FALSE,2,NULL,NOW()),
  (gen_random_uuid(),f,'radio','Wait time for food',FALSE,3,
   '["Under 10 min","10–20 min","20–30 min","Over 30 min"]',NOW()),
  (gen_random_uuid(),f,'radio','Will you visit again?',TRUE,4,
   '["Definitely","Probably","Maybe","Probably not"]',NOW());
INSERT INTO "FormFields"("Id","FormId","FieldType","Label","IsRequired","SortOrder","CreatedAt") VALUES
  (gen_random_uuid(),f,'long_text','Any comments or suggestions?',FALSE,5,NOW());

END $$;
