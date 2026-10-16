import { DatasetPreset } from '../types';

export const SAMPLE_DATASETS: DatasetPreset[] = [
  {
    id: 'ecommerce',
    name: 'E-Commerce Store & Orders',
    description: 'Realistic online shopping database with customers, products, categories, orders, and customer reviews.',
    category: 'Commercial',
    tables: ['customers', 'categories', 'products', 'orders', 'order_items', 'reviews'],
    setupSql: `
CREATE TABLE customers (
  id INT PRIMARY KEY,
  first_name STRING,
  last_name STRING,
  email STRING,
  city STRING,
  country STRING,
  joined_date DATE
);

INSERT INTO customers VALUES
(1, 'Elena', 'Rostova', 'elena.r@example.com', 'Berlin', 'Germany', '2023-01-15'),
(2, 'Marcus', 'Chen', 'marcus.chen@example.com', 'Singapore', 'Singapore', '2023-02-20'),
(3, 'Sarah', 'Jenkins', 's.jenkins@example.com', 'Austin', 'USA', '2023-03-10'),
(4, 'Amara', 'Okafor', 'amara.o@example.com', 'Lagos', 'Nigeria', '2023-04-05'),
(5, 'Liam', 'O''Connor', 'liam.oc@example.com', 'Dublin', 'Ireland', '2023-05-18'),
(6, 'Priya', 'Sharma', 'priya.s@example.com', 'Mumbai', 'India', '2023-06-22'),
(7, 'Lucas', 'Silva', 'lucas.silva@example.com', 'São Paulo', 'Brazil', '2023-07-30'),
(8, 'Yuki', 'Tanaka', 'yuki.t@example.com', 'Tokyo', 'Japan', '2023-08-14');

CREATE TABLE categories (
  id INT PRIMARY KEY,
  name STRING,
  slug STRING
);

INSERT INTO categories VALUES
(1, 'Electronics', 'electronics'),
(2, 'Audio & Music', 'audio-music'),
(3, 'Workspace & Furniture', 'workspace'),
(4, 'Accessories', 'accessories');

CREATE TABLE products (
  id INT PRIMARY KEY,
  name STRING,
  category_id INT,
  price DECIMAL(10, 2),
  stock_quantity INT,
  rating DECIMAL(3, 2)
);

INSERT INTO products VALUES
(101, 'Mechanical Keyboard (Tenkeyless)', 1, 129.99, 45, 4.8),
(102, 'Studio Monitor Headphones', 2, 199.50, 30, 4.9),
(103, 'Ergonomic Mesh Chair', 3, 349.00, 12, 4.7),
(104, '4K Ultrawide Monitor 34-inch', 1, 649.99, 8, 4.6),
(105, 'USB-C Aluminum Hub 8-in-1', 4, 59.95, 80, 4.4),
(106, 'Wireless Noise-Canceling Earbuds', 2, 149.00, 55, 4.5),
(107, 'Motorized Standing Desk 60x30', 3, 499.00, 15, 4.9),
(108, 'Precision Wireless Mouse', 4, 79.99, 60, 4.6);

CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT,
  order_date DATE,
  status STRING,
  total_amount DECIMAL(10, 2)
);

INSERT INTO orders VALUES
(1001, 1, '2023-11-02', 'delivered', 279.49),
(1002, 2, '2023-11-05', 'delivered', 649.99),
(1003, 3, '2023-11-12', 'delivered', 428.99),
(1004, 1, '2023-12-01', 'delivered', 199.50),
(1005, 4, '2023-12-15', 'delivered', 578.99),
(1006, 5, '2024-01-08', 'processing', 149.00),
(1007, 6, '2024-01-20', 'delivered', 998.00),
(1008, 7, '2024-02-02', 'shipped', 209.98),
(1009, 8, '2024-02-14', 'delivered', 129.99),
(1010, 2, '2024-02-28', 'delivered', 408.95);

CREATE TABLE order_items (
  id INT PRIMARY KEY,
  order_id INT,
  product_id INT,
  quantity INT,
  unit_price DECIMAL(10, 2)
);

INSERT INTO order_items VALUES
(1, 1001, 101, 1, 129.99),
(2, 1001, 106, 1, 149.00),
(3, 1002, 104, 1, 649.99),
(4, 1003, 103, 1, 349.00),
(5, 1003, 108, 1, 79.99),
(6, 1004, 102, 1, 199.50),
(7, 1005, 107, 1, 499.00),
(8, 1005, 108, 1, 79.99),
(9, 1006, 106, 1, 149.00),
(10, 1007, 107, 2, 499.00),
(11, 1008, 101, 1, 129.99),
(12, 1008, 108, 1, 79.99),
(13, 1009, 101, 1, 129.99),
(14, 1010, 103, 1, 349.00),
(15, 1010, 105, 1, 59.95);

CREATE TABLE reviews (
  id INT PRIMARY KEY,
  product_id INT,
  customer_id INT,
  rating INT,
  comment STRING,
  created_at DATE
);

INSERT INTO reviews VALUES
(1, 101, 1, 5, 'Exceptional tactile feedback. Heavy solid aluminum frame.', '2023-11-10'),
(2, 104, 2, 4, 'Great screen estate for multitasking, color accuracy is solid.', '2023-11-20'),
(3, 103, 3, 5, 'Best chair for lower back pain. Lumbar support is phenomenal.', '2023-11-25'),
(4, 107, 6, 5, 'Dual motors are silent and memory presets work like a charm.', '2024-01-28'),
(5, 108, 5, 4, 'Ergonomic shape is great, battery lasts over 3 weeks.', '2024-02-10');
`,
    sampleQueries: [
      {
        title: 'Customer Spending Ranking (Postgres CTE)',
        description: 'Computes total spent per customer, order frequency, and ranks them.',
        sql: `WITH customer_stats AS (
  SELECT 
    c.id,
    c.first_name || ' ' || c.last_name AS full_name,
    c.country,
    COUNT(o.id) AS total_orders,
    SUM(o.total_amount) AS total_spent
  FROM customers c
  JOIN orders o ON c.id = o.customer_id
  GROUP BY c.id, c.first_name, c.last_name, c.country
)
SELECT 
  full_name,
  country,
  total_orders,
  ROUND(total_spent, 2) AS total_spent,
  ROUND(total_spent / total_orders, 2) AS avg_order_value
FROM customer_stats
ORDER BY total_spent DESC;`
      },
      {
        title: 'Top Revenue Generating Products by Category',
        description: 'Analyzes which product category drives the highest revenue.',
        sql: `SELECT 
  cat.name AS category,
  p.name AS product,
  p.price,
  SUM(oi.quantity) AS units_sold,
  ROUND(SUM(oi.quantity * oi.unit_price), 2) AS total_revenue
FROM categories cat
JOIN products p ON cat.id = p.category_id
JOIN order_items oi ON p.id = oi.product_id
GROUP BY cat.name, p.name, p.price
ORDER BY total_revenue DESC;`
      },
      {
        title: 'High-Rated Products with Low Stock Alert',
        description: 'Finds products with rating >= 4.6 and stock below 20 units.',
        sql: `SELECT 
  name, 
  price, 
  rating, 
  stock_quantity,
  CASE 
    WHEN stock_quantity < 10 THEN 'CRITICAL'
    WHEN stock_quantity < 20 THEN 'LOW'
    ELSE 'SUFFICIENT'
  END AS inventory_status
FROM products
WHERE rating >= 4.6
ORDER BY stock_quantity ASC;`
      }
    ]
  },
  {
    id: 'tech_company',
    name: 'Tech Company & Payroll',
    description: 'Corporate organizational database with departments, employees, salaries, projects, and assignments.',
    category: 'Corporate',
    tables: ['departments', 'employees', 'salaries', 'projects', 'project_assignments'],
    setupSql: `
CREATE TABLE departments (
  id INT PRIMARY KEY,
  name STRING,
  location STRING,
  budget DECIMAL(12, 2)
);

INSERT INTO departments VALUES
(10, 'Core Engineering', 'San Francisco', 3500000.00),
(20, 'Product Design', 'New York', 1200000.00),
(30, 'Data Science & AI', 'Seattle', 2800000.00),
(40, 'Growth Marketing', 'London', 950000.00),
(50, 'Security & DevOps', 'Austin', 1800000.00);

CREATE TABLE employees (
  id INT PRIMARY KEY,
  first_name STRING,
  last_name STRING,
  email STRING,
  department_id INT,
  job_title STRING,
  hire_date DATE
);

INSERT INTO employees VALUES
(101, 'Sophia', 'Vargas', 'sophia.v@company.com', 10, 'Principal Architect', '2020-03-01'),
(102, 'Devon', 'Miller', 'devon.m@company.com', 10, 'Senior Backend Engineer', '2021-06-15'),
(103, 'Aisha', 'Kareem', 'aisha.k@company.com', 30, 'Staff ML Scientist', '2020-11-01'),
(104, 'Mateo', 'Rossi', 'mateo.r@company.com', 20, 'Lead Product Designer', '2021-02-10'),
(105, 'Chloe', 'Dubois', 'chloe.d@company.com', 40, 'Growth Director', '2022-01-20'),
(106, 'Kenji', 'Watanabe', 'kenji.w@company.com', 50, 'Site Reliability Engineer', '2021-09-01'),
(107, 'Zara', 'Mansoor', 'zara.m@company.com', 30, 'Data Engineer', '2022-05-12'),
(108, 'Julian', 'Hess', 'julian.h@company.com', 10, 'Full Stack Engineer', '2023-01-16'),
(109, 'Maya', 'Patel', 'maya.p@company.com', 20, 'UI/UX Designer', '2023-04-03'),
(110, 'Leon', 'Schneider', 'leon.s@company.com', 50, 'Security Specialist', '2022-08-19');

CREATE TABLE salaries (
  employee_id INT PRIMARY KEY,
  base_salary DECIMAL(10, 2),
  bonus DECIMAL(10, 2),
  equity_shares INT
);

INSERT INTO salaries VALUES
(101, 185000.00, 35000.00, 15000),
(102, 145000.00, 20000.00, 8000),
(103, 175000.00, 30000.00, 12000),
(104, 140000.00, 18000.00, 7500),
(105, 135000.00, 25000.00, 6000),
(106, 138000.00, 16000.00, 6500),
(107, 125000.00, 15000.00, 5000),
(108, 115000.00, 12000.00, 4000),
(109, 105000.00, 10000.00, 3000),
(110, 130000.00, 15000.00, 5500);

CREATE TABLE projects (
  id INT PRIMARY KEY,
  name STRING,
  priority STRING,
  deadline DATE
);

INSERT INTO projects VALUES
(1, 'Autonomous Analytics Engine', 'High', '2024-09-30'),
(2, 'Zero-Trust Infrastructure', 'Critical', '2024-06-30'),
(3, 'Design System Refresh v3', 'Medium', '2024-08-15'),
(4, 'Global Latency Optimization', 'High', '2024-11-01');

CREATE TABLE project_assignments (
  id INT PRIMARY KEY,
  project_id INT,
  employee_id INT,
  role STRING,
  allocated_pct INT
);

INSERT INTO project_assignments VALUES
(1, 1, 103, 'Lead Scientist', 60),
(2, 1, 107, 'Data Pipeline Dev', 50),
(3, 1, 101, 'Architecture Advisor', 25),
(4, 2, 106, 'Infra Lead', 75),
(5, 2, 110, 'Security Lead', 80),
(6, 3, 104, 'Design Lead', 70),
(7, 3, 109, 'Component Design', 80),
(8, 3, 108, 'Frontend Integration', 50),
(9, 4, 101, 'Network Optimization', 50),
(10, 4, 102, 'Cache Tuning', 60);
`,
    sampleQueries: [
      {
        title: 'Department Salary Benchmarking',
        description: 'Aggregates compensation, bonus ratios, and team headcount per department.',
        sql: `SELECT 
  d.name AS department,
  d.location,
  COUNT(e.id) AS team_size,
  ROUND(AVG(s.base_salary), 2) AS avg_base_salary,
  ROUND(MAX(s.base_salary), 2) AS max_base_salary,
  ROUND(SUM(s.base_salary + s.bonus), 2) AS total_payroll_cost
FROM departments d
JOIN employees e ON d.id = e.department_id
JOIN salaries s ON e.id = s.employee_id
GROUP BY d.name, d.location
ORDER BY total_payroll_cost DESC;`
      },
      {
        title: 'High-Comp Employees (Window Function / CTE)',
        description: 'Finds employees making above their respective department average.',
        sql: `WITH dept_averages AS (
  SELECT 
    d.id AS dept_id,
    d.name AS dept_name,
    AVG(s.base_salary) AS dept_avg_salary
  FROM departments d
  JOIN employees e ON d.id = e.department_id
  JOIN salaries s ON e.id = s.employee_id
  GROUP BY d.id, d.name
)
SELECT 
  e.first_name || ' ' || e.last_name AS employee,
  e.job_title,
  da.dept_name,
  s.base_salary,
  ROUND(da.dept_avg_salary, 2) AS dept_avg_salary,
  ROUND(s.base_salary - da.dept_avg_salary, 2) AS diff_from_dept_avg
FROM employees e
JOIN departments d ON e.department_id = d.id
JOIN salaries s ON e.id = s.employee_id
JOIN dept_averages da ON d.id = da.dept_id
WHERE s.base_salary > da.dept_avg_salary
ORDER BY diff_from_dept_avg DESC;`
      }
    ]
  },
  {
    id: 'postgres_analytics',
    name: 'PostgreSQL Analytics & Telemetry',
    description: 'Advanced SQL playground with JSON attributes, event streams, and time-series metrics.',
    category: 'Analytics',
    tables: ['events', 'user_sessions', 'server_metrics'],
    setupSql: `
CREATE TABLE events (
  id INT PRIMARY KEY,
  event_name STRING,
  user_id INT,
  browser STRING,
  country STRING,
  payload_value DECIMAL(8, 2),
  event_time STRING
);

INSERT INTO events VALUES
(1, 'page_view', 501, 'Chrome', 'US', 0.00, '2024-03-01 08:14:22'),
(2, 'cta_click', 501, 'Chrome', 'US', 1.00, '2024-03-01 08:16:05'),
(3, 'add_to_cart', 501, 'Chrome', 'US', 89.50, '2024-03-01 08:18:40'),
(4, 'page_view', 502, 'Safari', 'UK', 0.00, '2024-03-01 08:20:10'),
(5, 'checkout_started', 501, 'Chrome', 'US', 89.50, '2024-03-01 08:21:15'),
(6, 'page_view', 503, 'Firefox', 'Germany', 0.00, '2024-03-01 08:25:30'),
(7, 'add_to_cart', 503, 'Firefox', 'Germany', 145.00, '2024-03-01 08:28:10'),
(8, 'checkout_completed', 501, 'Chrome', 'US', 89.50, '2024-03-01 08:30:00'),
(9, 'page_view', 504, 'Edge', 'Japan', 0.00, '2024-03-01 08:35:12'),
(10, 'search_performed', 504, 'Edge', 'Japan', 0.00, '2024-03-01 08:36:45');

CREATE TABLE user_sessions (
  session_id INT PRIMARY KEY,
  user_id INT,
  duration_seconds INT,
  pages_viewed INT,
  converted INT
);

INSERT INTO user_sessions VALUES
(101, 501, 938, 7, 1),
(102, 502, 142, 2, 0),
(103, 503, 540, 5, 0),
(104, 504, 310, 3, 0),
(105, 505, 1240, 9, 1),
(106, 506, 85, 1, 0),
(107, 507, 620, 6, 1);

CREATE TABLE server_metrics (
  id INT PRIMARY KEY,
  server_node STRING,
  cpu_pct DECIMAL(5, 2),
  ram_used_gb DECIMAL(5, 2),
  recorded_at STRING
);

INSERT INTO server_metrics VALUES
(1, 'node-us-east-1', 42.5, 14.2, '10:00:00'),
(2, 'node-us-east-2', 68.2, 22.8, '10:00:00'),
(3, 'node-eu-west-1', 28.1, 9.4, '10:00:00'),
(4, 'node-us-east-1', 48.0, 15.1, '10:05:00'),
(5, 'node-us-east-2', 74.5, 25.0, '10:05:00'),
(6, 'node-eu-west-1', 31.0, 10.2, '10:05:00');
`,
    sampleQueries: [
      {
        title: 'Funnel Conversion & Event Breakdown',
        description: 'Aggregates event frequency and breakdown across browser clients.',
        sql: `SELECT 
  event_name,
  browser,
  COUNT(*) AS total_triggers,
  ROUND(SUM(payload_value), 2) AS total_value
FROM events
GROUP BY event_name, browser
ORDER BY total_triggers DESC;`
      },
      {
        title: 'User Session Engagement & Conversion Rate',
        description: 'Calculates average duration, page depth, and overall conversion rate.',
        sql: `SELECT 
  COUNT(*) AS total_sessions,
  SUM(converted) AS total_conversions,
  ROUND(100.0 * SUM(converted) / COUNT(*), 1) AS conversion_rate_pct,
  ROUND(AVG(duration_seconds), 0) AS avg_duration_sec,
  ROUND(AVG(pages_viewed), 1) AS avg_pages_depth
FROM user_sessions;`
      }
    ]
  }
];
