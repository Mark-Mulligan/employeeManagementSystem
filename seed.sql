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
('Dwight', 'Schrute', 1, null),
('Jim', 'Halpert', 2, 1),
('Stanley', 'Hudson', 2, 1),
('Creed', 'Bratton', 3,  null),
('Darryl', 'Philbin', 4, 4),
('Andy', 'Bernard', 4, 4),
('Oscar', 'Martinez', 5,  null),
('Angela', 'Martin', 6, 7),
('Kevin', 'Malone', 6, 7),
('David', 'Wallace', 7,  null),
('Ryan', 'Howard', 8, 10),
('Gabe', 'Lewis', 8, 10);