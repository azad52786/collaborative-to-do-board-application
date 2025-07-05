// MongoDB initialization script
db = db.getSiblingDB('collabboard');

// Create application user
db.createUser({
  user: 'collabboard_user',
  pwd: 'collabboard_password',
  roles: [
    {
      role: 'readWrite',
      db: 'collabboard'
    }
  ]
});

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 2,
          maxLength: 100,
          description: 'User name is required and must be a string'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'Email must be a valid email address'
        },
        password: {
          bsonType: 'string',
          minLength: 6,
          description: 'Password is required and must be at least 6 characters'
        },
        avatar: {
          bsonType: 'string',
          description: 'User avatar initials'
        },
        isActive: {
          bsonType: 'bool',
          description: 'User active status'
        },
        createdAt: {
          bsonType: 'date',
          description: 'User creation date'
        },
        lastLoginAt: {
          bsonType: 'date',
          description: 'Last login date'
        }
      }
    }
  }
});

db.createCollection('tasks', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'description', 'status', 'createdBy'],
      properties: {
        title: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 200,
          description: 'Task title is required'
        },
        description: {
          bsonType: 'string',
          maxLength: 1000,
          description: 'Task description'
        },
        status: {
          bsonType: 'string',
          enum: ['todo', 'inProgress', 'done'],
          description: 'Task status must be one of: todo, inProgress, done'
        },
        priority: {
          bsonType: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Task priority must be one of: low, medium, high'
        },
        createdBy: {
          bsonType: 'objectId',
          description: 'User ID who created the task'
        },
        assignedTo: {
          bsonType: 'objectId',
          description: 'User ID assigned to the task'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Task creation date'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Task last update date'
        },
        dueDate: {
          bsonType: 'date',
          description: 'Task due date'
        }
      }
    }
  }
});

db.createCollection('activities', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['user', 'action', 'timestamp'],
      properties: {
        user: {
          bsonType: 'objectId',
          description: 'User ID who performed the action'
        },
        action: {
          bsonType: 'string',
          enum: ['created', 'updated', 'moved', 'assigned', 'deleted'],
          description: 'Action type'
        },
        taskId: {
          bsonType: 'objectId',
          description: 'Task ID related to the action'
        },
        details: {
          bsonType: 'object',
          description: 'Additional action details'
        },
        timestamp: {
          bsonType: 'date',
          description: 'Action timestamp'
        }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ isActive: 1 });

db.tasks.createIndex({ createdBy: 1 });
db.tasks.createIndex({ assignedTo: 1 });
db.tasks.createIndex({ status: 1 });
db.tasks.createIndex({ createdAt: -1 });
db.tasks.createIndex({ 
  createdBy: 1, 
  assignedTo: 1, 
  status: 1 
});

db.activities.createIndex({ user: 1 });
db.activities.createIndex({ taskId: 1 });
db.activities.createIndex({ timestamp: -1 });

print('Database initialization completed successfully!');
