-- The skill catalogue is open: students and blueprints can add any skill (POST /skills).
-- Names are unique ignoring case so "react" and "React" never become two skills.
CREATE UNIQUE INDEX IF NOT EXISTS skill_name_lower_key ON skill (lower(name));

-- A broad starting catalogue across fields, so most people find their skills without typing them.
INSERT INTO skill (name, category) VALUES
  -- Software
  ('C', 'Software'), ('C++', 'Software'), ('C#', 'Software'), ('Go', 'Software'), ('Rust', 'Software'),
  ('Kotlin', 'Software'), ('Swift', 'Software'), ('PHP', 'Software'), ('Node.js', 'Software'),
  ('HTML & CSS', 'Software'), ('Android Development', 'Software'), ('iOS Development', 'Software'),
  ('Flutter', 'Software'), ('REST APIs', 'Software'), ('SQL', 'Software'), ('MongoDB', 'Software'),
  ('Linux', 'Software'), ('Cloud (AWS)', 'Software'), ('Cybersecurity', 'Software'), ('Game Development', 'Software'),
  ('Unity', 'Software'), ('Testing & QA', 'Software'), ('Computer Vision', 'Software'), ('Deep Learning', 'Software'),
  ('Data Visualisation', 'Software'), ('Excel', 'Software'), ('MATLAB', 'Software'), ('Blockchain', 'Software'),
  -- Electronics & hardware
  ('Embedded C', 'Electronics'), ('Arduino', 'Electronics'), ('Raspberry Pi', 'Electronics'), ('Soldering', 'Electronics'),
  ('Circuit Design', 'Electronics'), ('PCB Design', 'Electronics'), ('Microcontrollers', 'Electronics'),
  ('Sensors & IoT', 'Electronics'), ('Power Electronics', 'Electronics'), ('Signal Processing', 'Electronics'),
  ('Robotics', 'Electronics'), ('Control Systems', 'Electronics'), ('Drone Building', 'Electronics'), ('Radio & RF', 'Electronics'),
  -- Mechanical & making
  ('CAD (SolidWorks)', 'Mechanical'), ('AutoCAD', 'Mechanical'), ('3D Printing', 'Mechanical'), ('CNC Machining', 'Mechanical'),
  ('Welding', 'Mechanical'), ('Woodworking', 'Mechanical'), ('Mechanical Design', 'Mechanical'), ('Thermodynamics', 'Mechanical'),
  ('Fluid Mechanics', 'Mechanical'), ('Automobile Repair', 'Mechanical'), ('Carpentry', 'Mechanical'), ('Plumbing', 'Mechanical'),
  -- Civil & architecture
  ('Structural Analysis', 'Civil'), ('Surveying', 'Civil'), ('Architecture', 'Civil'), ('Interior Design', 'Civil'),
  ('Revit', 'Civil'), ('Construction Management', 'Civil'),
  -- Science & lab
  ('Titration', 'Lab'), ('Chromatography', 'Lab'), ('Spectroscopy', 'Lab'), ('Microscopy', 'Lab'), ('PCR', 'Lab'),
  ('Cell Culture', 'Lab'), ('Lab Safety', 'Lab'), ('Organic Synthesis', 'Lab'), ('Analytical Chemistry', 'Lab'),
  ('Microbiology', 'Lab'), ('Biotechnology', 'Lab'), ('Physics Experiments', 'Lab'), ('Statistics', 'Lab'),
  ('Research Writing', 'Lab'),
  -- Medical & health
  ('First Aid', 'Medical'), ('CPR', 'Medical'), ('Patient Care', 'Medical'), ('Anatomy', 'Medical'), ('Pharmacology', 'Medical'),
  ('Clinical Diagnosis', 'Medical'), ('Nursing', 'Medical'), ('Physiotherapy', 'Medical'), ('Nutrition', 'Medical'),
  ('Public Health', 'Medical'), ('Mental Health Support', 'Medical'), ('Dentistry', 'Medical'), ('Medical Imaging', 'Medical'),
  -- Food
  ('Cooking', 'Food'), ('Baking', 'Food'), ('Knife Skills', 'Food'), ('Indian Cuisine', 'Food'), ('Pastry', 'Food'),
  ('Food Safety', 'Food'), ('Menu Planning', 'Food'), ('Catering', 'Food'), ('Food Photography', 'Food'), ('Barista', 'Food'),
  -- Art & design
  ('Painting', 'Art'), ('Drawing', 'Art'), ('Sketching', 'Art'), ('Calligraphy', 'Art'), ('Sculpture', 'Art'),
  ('Pottery', 'Art'), ('Illustration', 'Art'), ('Graphic Design', 'Art'), ('Adobe Photoshop', 'Art'),
  ('Adobe Illustrator', 'Art'), ('UI Design', 'Art'), ('Animation', 'Art'), ('3D Modelling (Blender)', 'Art'),
  ('Fashion Design', 'Art'), ('Tailoring', 'Art'), ('Embroidery', 'Art'), ('Mural Painting', 'Art'),
  -- Media & performing arts
  ('Photography', 'Media'), ('Videography', 'Media'), ('Video Editing', 'Media'), ('Sound Editing', 'Media'),
  ('Music Production', 'Media'), ('Singing', 'Media'), ('Guitar', 'Media'), ('Piano', 'Media'), ('Drums', 'Media'),
  ('Dance', 'Media'), ('Acting', 'Media'), ('Script Writing', 'Media'), ('Podcasting', 'Media'), ('Stage Lighting', 'Media'),
  -- Writing & languages
  ('Copywriting', 'Writing'), ('Creative Writing', 'Writing'), ('Journalism', 'Writing'), ('Technical Writing', 'Writing'),
  ('Editing & Proofreading', 'Writing'), ('Translation', 'Writing'), ('English', 'Writing'), ('Hindi', 'Writing'),
  ('Marathi', 'Writing'), ('French', 'Writing'), ('German', 'Writing'), ('Japanese', 'Writing'), ('Sign Language', 'Writing'),
  -- Business
  ('Marketing', 'Business'), ('Social Media Marketing', 'Business'), ('SEO', 'Business'), ('Sales', 'Business'),
  ('Accounting', 'Business'), ('Finance', 'Business'), ('Budgeting', 'Business'), ('Business Strategy', 'Business'),
  ('Entrepreneurship', 'Business'), ('Fundraising', 'Business'), ('Customer Support', 'Business'), ('Supply Chain', 'Business'),
  ('Law & Contracts', 'Business'), ('Human Resources', 'Business'),
  -- People & organising
  ('Public Speaking', 'People'), ('Teaching', 'People'), ('Tutoring', 'People'), ('Event Management', 'People'),
  ('Team Leadership', 'People'), ('Negotiation', 'People'), ('Community Outreach', 'People'), ('Counselling', 'People'),
  ('Volunteering', 'People'), ('Childcare', 'People'), ('Elderly Care', 'People'), ('Debate', 'People'),
  -- Hands-on & everyday
  ('Cleaning', 'Hands-on'), ('Housekeeping', 'Hands-on'), ('Gardening', 'Hands-on'), ('Farming', 'Hands-on'),
  ('Electrical Wiring', 'Hands-on'), ('Painting & Decorating', 'Hands-on'), ('Driving', 'Hands-on'), ('Logistics', 'Hands-on'),
  ('Repair & Maintenance', 'Hands-on'), ('Animal Care', 'Hands-on'),
  -- Sport & fitness
  ('Fitness Training', 'Sport'), ('Yoga', 'Sport'), ('Football', 'Sport'), ('Cricket', 'Sport'), ('Swimming', 'Sport'),
  ('Coaching', 'Sport'), ('Sports Analytics', 'Sport'), ('Martial Arts', 'Sport')
ON CONFLICT DO NOTHING;
