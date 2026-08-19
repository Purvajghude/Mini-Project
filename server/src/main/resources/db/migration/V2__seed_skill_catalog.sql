-- Baseline skill catalogue. Students pick from this shared list so skills are
-- comparable between profiles, which is what makes complementarity scoring
-- possible at all. Deliberately spans technical, creative, data, communication
-- and management work so non-programmers are first-class on the platform.
--
-- Runs once on a fresh database, so no upsert clause is needed (and avoiding one
-- keeps this migration portable across H2 and PostgreSQL).
insert into skills (name, category) values
    ('Java', 'Development'),
    ('Spring Boot', 'Development'),
    ('PostgreSQL', 'Data'),
    ('React', 'Development'),
    ('JavaScript', 'Development'),
    ('HTML/CSS', 'Development'),
    ('Python', 'Development'),
    ('REST APIs', 'Development'),
    ('Android', 'Development'),
    ('Docker', 'DevOps'),
    ('Git', 'Development'),
    ('Figma', 'Design'),
    ('UI/UX Design', 'Design'),
    ('Illustration', 'Design'),
    ('User Research', 'Design'),
    ('Data Analysis', 'Data'),
    ('Machine Learning', 'Data'),
    ('Technical Writing', 'Communication'),
    ('Video Editing', 'Communication'),
    ('Project Management', 'Management'),
    ('Public Speaking', 'Communication'),
    ('Event Management', 'Management');
