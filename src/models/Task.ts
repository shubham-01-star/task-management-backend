import mongoose, { Document, Schema, Types } from 'mongoose';

// 1. Define the Task Interface
export interface ITask extends Document {
  title: string;
  description?: string;
  dueDate?: Date;
  priority: 'Low' | 'Medium' | 'High'; // Strongly typed for filtering [cite: 40, 77]
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue'; // Strongly typed for filtering [cite: 40, 77]
  
  // Security and Assignment Links [cite: 47, 51]
  assignedTo: Types.ObjectId; // References the User model (who must complete the task)
  createdBy: Types.ObjectId;  // References the User model (who created the task)
}

// 2. Define the Schema
const TaskSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High'], 
    default: 'Medium' 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Completed', 'Overdue'], 
    default: 'Pending' 
  },
  assignedTo: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

// Add indexes for performance
TaskSchema.index({ status: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ assignedTo: 1 });
TaskSchema.index({ createdBy: 1 });
TaskSchema.index({ title: 'text', description: 'text' });

// 3. Export the Model
export default mongoose.model<ITask>('Task', TaskSchema);