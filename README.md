FA - Campus Lost & Found System
Project Title: Campus Lost & Found Web Portal
Name: Hooi Jin Theng (QIU-202510-008707)
Tools and Technologies Used
Frontend: HTML5, CSS3, JavaScript

Backend: Node.js, Express.js

Database: MongoDB Atlas (Cloud Database)

Security: bcrypt for password hashing, DOMPurify/Custom Sanitizer for XSS prevention

Deployment: Render (Cloud Hosting)

Steps to Run the Project
1. Prerequisites
Ensure you have Node.js installed on your computer.
A MongoDB Atlas account (or local MongoDB) and a .env file with your connection string.

3. Installation
Download/Clone the project repository to your local machine.
Open your terminal/command prompt in the project root folder.
Run the following command to install required packages:
npm install

3. Configuration
Create a file named .env in the root directory.
Add your MongoDB connection string:
Code snippet
MONGODB_URI=your_mongodb_atlas_link_here
PORT=3000

5. Running Locally
In the terminal, start the server by running:
node server.js
Open your browser and navigate to: http://localhost:3000/home.html

Project Structure & Navigation
Home Page: [http://localhost:3000/home.html](https://fa-webtechnology-lostfound.onrender.com/home.html) - The landing page of the portal.
Items Gallery: [http://localhost:3000/index.html](https://fa-webtechnology-lostfound.onrender.com/index.html) - View all lost and found items.
Post an Item: Users must be logged in to post. New users can register via the Login/Register page.
User Dashboard: Manage your own posts and profile information.

Key Features & Security
Restricted Domain: Only users with @qiu.edu.my emails can register.
Data Security: All passwords are encrypted using bcrypt before being stored in the database.

Input Protection: Backend sanitization is implemented to prevent XSS (Cross-Site Scripting) attacks.
Optimization: Gzip compression enabled via compression middleware for faster performance.
