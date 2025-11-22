// Assuming this is how your User Model looks
// (This file was not provided, but this is the likely cause of your issue)

import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string; // Optional because we exclude it on read
  role: 'Admin' | 'Manager' | 'User';
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Admin', 'Manager', 'User'], 
    default: 'User' // <-- Default value is set here
  },
  createdAt: { type: Date, default: Date.now }
});

// Remove password from response (using a pre-save hook or in the controller)
UserSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        delete ret.password;
        return ret;
    }
});


export default mongoose.model<IUser>('User', UserSchema);