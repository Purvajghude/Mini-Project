INSERT INTO skill (name, category) VALUES
  ('Java', 'Backend'), ('Spring Boot', 'Backend'), ('PostgreSQL', 'Data'),
  ('JavaScript', 'Frontend'), ('React', 'Frontend'), ('TypeScript', 'Frontend'),
  ('Python', 'Data'), ('Data Analysis', 'Data'), ('Machine Learning', 'Data'),
  ('Figma', 'Design'), ('Product Research', 'Design'), ('UX Writing', 'Design'),
  ('Docker', 'DevOps'), ('Git', 'Engineering'), ('Project Management', 'Collaboration')
ON CONFLICT (name) DO NOTHING;
