# PRODUCT MICROSERVICE | rsc-evt

<img width='200px' height='200px' src='https://firebasestorage.googleapis.com/v0/b/booknowgotlk.appspot.com/o/BooknowDotLk.svg?alt=media&token=3fcebb25-399a-414a-a229-257f00992b19'/>

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Folder Structure](#folder-structure)
- [Environment Variables](#environment-variables)
- [Git Workflow](#git-workflow)
- [Git Branching Naming Convention](#git-branching-naming-convention)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

**rsc-evt** is a transaction handling platform where users can browse through a list of selling items, view details, and order goods for them. The application leverages modern web technologies to ensure a smooth and efficient user experience.

## Tech Stack

- Node.js
- MySQL

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (version 20.x or later)
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
- MySQL database **(An empty database must exist. It will not be created automatically.)**

### Installation

1. Clone the repository:

```bash
git clone https://github.com/4kraken4/rsc-evt-product-service.git
cd rsc-evt-product-service
```

2. Install dependencies

```bash
  npm install
```

### Running the Service

To start the **development** server, run:

```bash
  npm run dev
```

To start the **production** server, run:

```bash
  npm start
```

The application will be available at http://localhost:9002.

## Folder Structure

Here is the folder structure of the project:

```bash
rsc-evt-product-service/
├── .github/
│   ├── workflows/
│   │   ├── ci-cd.yml
├── src/
│   ├── config/
│   │   ├── Config.js
│   │   ├── Sequelize.js
│   ├── controllers/
│   │   ├── cartController.js
│   │   ├── productController.js
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── Product.js
│   │   ├── repositories/
│   │   │   ├── CartRepository.js
│   │   │   ├── ProductRepository.js
│   │   ├── usecases/
│   │   │   ├── GetAllProducts.js
│   │   │   ├── GetByCode.js
│   │   │   ├── GetById.js
│   │   │   ├── GetListByCodes.js
│   │   │   ├── GetPendingCart.js
│   │   │   ├── RemoveProduct.js
│   │   │   ├── SaveCart.js
│   │   │   ├── SaveProduct.js
│   │   │   ├── SearchProduct.js
│   │   │   ├── UpdateCart.js
│   │   │   ├── UpdateProduct.js
│   ├── infrastructure/
│   │   ├── enum/
│   │   │   ├── types.js
│   │   ├── orm/
│   │   │   ├── associations.js
│   │   │   ├── CartRepositoryImpl.js
│   │   │   ├── ProductRepositoryImpl.js
│   │   │   ├── SequelizeCartItemsModel.js
│   │   │   ├── SequelizeCartModel.js
│   │   │   ├── SequelizeProductModel.js
│   │   ├── middlewares/
│   │   │   ├── errorHandler.js
│   ├── interfaces/
│   │   ├── http/
│   │   │   ├── routes/
│   │   │   │   ├── cartRoutes.js
│   │   │   │   ├── productRoutes.js
│   │   │   │   ├── routes.js
│   ├── utils/
│   │   ├── CircuiteBreaker.js
│   ├── .env
│   ├── .env.development
│   ├── .env.production
│   ├── app.js
├── tests/
│   ├── config/
│   │   ├── sequelize.test.js
│   ├── controllers/
│   │   ├── productController.test.js
│   ├── domain/
│   │   ├── entities/
│   │   ├── repositories/
│   │   ├── usecases/
│   │   │   ├── CreateProduct.test.js
│   ├── infrastructure/
│   │   ├── orm/
│   ├── middlewares/
│   ├── interfaces/
│   │   ├── http/
│   │   │   ├── routes/
│   ├── utils/
├── .babelrc
├── Dockerfile
├── .dockerignore
├── .gitignore
├── eslint.config.js
├── jest.config.js
├── jest.setup.js
├── nodemon.json
├── package.json
├── README.md
```

## Environment Variables

The following environment variables are required to configure the `rsc-evt-product-service`. These variables should be placed in a `.env.<environment>` files in the root directory of the project.

| Variable               | Description                        | Example Value              |
| ---------------------- | ---------------------------------- | -------------------------- |
| `NODE_ENV`             | Environment mode                   | `development`              |
| `APP_NAME`             | Application name                   | `rsc-evt`                  |
| `SERVICE_PORT`         | Port on which the service will run | `9003`                     |
| `SERVICE_NAME`         | Name of the service                | `rsc-evt-product-service`  |
| `SERVICE_VERSION`      | Version of the service             | `1.0.0`                    |
| `SERVICE_PROTOCOL`     | Service protocol                   | `http`                     |
| `SERVICE_HOST`         | Service host                       | `localhost`                |
| `SERVICE_ROUTE_PREFIX` | Prefix for routing                 | `api/v1/products`          |
| `MYSQL_DB_NAME`        | Name of the MySQL database         | `rsc-evt-tenent-1`         |
| `MYSQL_HOST`           | MySQL database host                | `localhost`                |
| `MYSQL_PORT`           | MySQL database port                | `3306`                     |
| `MYSQL_USER`           | MySQL database username            | `<your_mysql_username>`    |
| `MYSQL_PASS`           | MySQL database password            | `<your_mysql_password>`    |
| `MYSQL_DIALECT`        | Database dialect                   | `mysql`                    |
| `SERVER_CERT_PATH`     | Path to the server certificate     | `C:\\Certs\\X509-cert.pem` |

### Example .env.development File

```dotenv
NODE_ENV=development
APP_NAME=rsc-evt
SERVICE_PORT=9003
SERVICE_VERSION=1.0.0
SERVICE_NAME=rsc-evt-product-service
SERVICE_PROTOCOL=http
SERVICE_HOST=localhost
SERVICE_ROUTE_PREFIX=api/v1/products

MYSQL_DB_NAME=rsc-evt-tenent-1
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASS=
MYSQL_DIALECT=mysql

SERVER_CERT_PATH=C:\\Certs\\X509-cert.pem
```

## Git Workflow

To maintain a clean and efficient development process, we use the following workflow involving our main branches: `production`, `testing`, and `master`.

### Main Branches

- **`master`**: The primary branch that always reflects a stable version of the project.
- **`testing`**: The branch used for testing new features and bug fixes before they are merged into `master`.
- **`production`**: The branch that reflects the live version of the project in production.

### Branch Workflow

1. **Developing New Features**
   - Create a new feature branch from `testing`.
   - Naming convention: `feature/{short-description}`
   - Example: `feature/user-registration`
   - Work on your feature in the newly created branch.
   - Once the feature is complete, thoroughly test it locally.

2. **Fixing Bugs**
   - Create a new bug fix branch from `testing`.
   - Naming convention: `bugfix/{short-description}`
   - Example: `bugfix/fix-login-error`
   - Fix the bug and test it locally.
   - Merge the bug fix branch into `testing`.

3. **Hotfixes**
   - Create a new hotfix branch from `production`.
   - Naming convention: `hotfix/{short-description}`
   - Example: `hotfix/patch-critical-bug`
   - Apply the critical fix and test it.
   - Merge the hotfix branch into both `production` and `master`.

4. **Testing**
   - Merge feature and bug fix branches into `testing` for integration testing.
   - Ensure all tests pass in the `testing` branch.
   - Perform any necessary quality assurance processes.

5. **Releasing to Production**
   - Once all features and fixes in `testing` are verified, merge `testing` into `master`.
   - After final verification on `master`, merge `master` into `production` for the release.
   - Deploy the `production` branch to the live environment.

### Example Commands

**Creating a New Feature Branch**

```bash
git checkout -b feature/user-registration testing
```

## Git Branching Naming Convention

To maintain a clean and manageable Git repository, we follow specific naming conventions for our branches:

- **Feature Branches:**
  - Naming convention: `feature/{short-description}`
  - Example: `feature/user-registration`

- **Bug Fix Branches:**
  - Naming convention: `bugfix/{short-description}`
  - Example: `bugfix/fix-login-error`

- **Hotfix Branches:**
  - Naming convention: `hotfix/{short-description}`
  - Example: `hotfix/patch-critical-bug`

- **Release Branches:**
  - Naming convention: `release/{version-number}`
  - Example: `release/1.0.0`

- **Documentation Branches:**
  - Naming convention: `doc/{short-description}`
  - Example: `doc/update-readme`

  **Note:** _Use only if altering documentation files not related to any Feature, Bugfix, Hotfix or Release implementation. Make sure to update `doc` branch from `master` before making changes._

## Contributing

Contributions are welcome! Please read the [contributing guidelines](#contributing-guidelines) first.

## License

This project is licensed under the MIT License. See the [LICENSE](#license) file for more information.
