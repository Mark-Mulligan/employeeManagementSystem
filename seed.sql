Use employee_tracker_db;

INSERT INTO departments (name) VALUES
('Sales'),
('Engineering'),
('Finance'),
('Legal');

INSERT INTO roles (title, salary, department_id) VALUES
('Sales Lead', 90000, 1),
('Salesperson', 40000, 1),
('Lead Engineer', 120000, 2),
('Software Engineer', 65000, 2),
('Account Manager', 130000, 3),
('Accountant', 60000, 3),
('Legal Team Lead', 450000, 4),
('Lawyer', 150000, 4);

INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES
('Tim', 'Jenkins', 1, null),
('Kevin', 'James', 2, 1),
('Stacy', 'Evans', 2, 1),
('Steve', 'Cook', 3,  null),
('Anna', 'Jameson', 4, 4),
('Bart', 'Simpson', 4, 4),
('Cathy', 'Woods', 5,  null),
('Bill', 'Ackman', 6, 7),
('Warren', 'Buffet', 6, 7),
('Jessica', 'Jones', 7,  null),
('Steve', 'Jordan', 8, 10),
('Olaf', 'Winterfield', 8, 10);