CREATE TABLE abouts(
    id INTEGER PRIMARY KEY CHECK (id = 1),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    address VARCHAR(50),
    phone VARCHAR(50),
    email VARCHAR(100),
    description_tr TEXT,
    description_en TEXT,
    short_description_tr TEXT,
    short_description_en TEXT,
    image_url TEXT,
    cv_document_url_tr TEXT,
    cv_original_file_name_tr TEXT,
    cv_document_url_en TEXT,
    cv_original_file_name_en TEXT
);

INSERT INTO abouts(id, first_name, last_name) VALUES (1,'Bahadır Alp', 'Er');

CREATE TABLE experiences(
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY ,
    title_tr VARCHAR(100) NOT NULL,
    title_en VARCHAR(100) NOT NULL,
    company VARCHAR(100) NOT NULL,
    location_tr VARCHAR(100),
    location_en VARCHAR(100),
    image_url TEXT,
    start_date DATE NOT NULL,
    end_date DATE,

    CONSTRAINT experiences_check_date CHECK (end_date >= start_date)

);

CREATE TABLE experience_responsibilities(
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY ,
    experience_id INTEGER NOT NULL,
    description_tr TEXT NOT NULL,
    description_en TEXT NOT NULL,
    display_order INT NOT NULL ,

    FOREIGN KEY ("experience_id") REFERENCES "experiences"("id") ON DELETE CASCADE
);

CREATE INDEX idx_exp_responsibilities_order ON experience_responsibilities(experience_id,display_order);

CREATE TABLE educations(
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    institution_tr VARCHAR(100) NOT NULL,
    institution_en VARCHAR(100) NOT NULL,
    department_tr VARCHAR(100),
    department_en VARCHAR(100),
    description_tr TEXT,
    description_en TEXT,
    image_url TEXT,
    start_date DATE NOT NULL,
    end_date DATE,

    CONSTRAINT educations_check_date CHECK (end_date >= start_date)
);

CREATE TABLE projects(
     id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     title_tr VARCHAR(150) NOT NULL,
     title_en VARCHAR(150) NOT NULL,
     description_tr TEXT,
     description_en TEXT,
     tools TEXT,
     link TEXT,
     demo_url TEXT,
     image_url TEXT,
     display_order INT NOT NULL
);

CREATE TABLE certificates(
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title_tr VARCHAR(200) NOT NULL,
    title_en VARCHAR(200) NOT NULL,
    issuer VARCHAR(100),
    issue_date DATE,
    display_order INT NOT NULL,
    pdf_url TEXT
);

CREATE TABLE skills(
     id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     name_tr VARCHAR(100) NOT NULL,
     name_en VARCHAR(100) NOT NULL,
     category VARCHAR(100) NOT NULL
);

CREATE TABLE contact_messages(
     id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     full_name VARCHAR(100) NOT NULL,
     email VARCHAR(100) NOT NULL,
     subject VARCHAR(200) NOT NULL,
     message TEXT NOT NULL,
     sent_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ,
     is_read BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE users(
    id INTEGER PRIMARY KEY CHECK (id = 1),
    username VARCHAR(100) UNIQUE NOT NULL ,
    hashed_password TEXT NOT NULL

);



