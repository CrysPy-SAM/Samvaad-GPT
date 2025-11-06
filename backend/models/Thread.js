import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ["user", "assistant", "system"],
        required: true,
        index: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 10000
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    metadata: {
        model: String,
        tokens: Number,
        edited: { type: Boolean, default: false },
        editedAt: Date
    }
}, { _id: true });

const ThreadSchema = new mongoose.Schema({
    threadId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    title: {
        type: String,
        default: "New Chat",
        maxlength: 200,
        trim: true
    },
    messages: {
        type: [MessageSchema],
        default: [],
        validate: {
            validator: function(messages) {
                return messages.length <= 1000; // Max 1000 messages per thread
            },
            message: "Thread cannot have more than 1000 messages"
        }
    },
    settings: {
        model: {
            type: String,
            default: "llama-3.3-70b-versatile"
        },
        temperature: {
            type: Number,
            default: 0.7,
            min: 0,
            max: 2
        },
        systemPrompt: String
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    pinned: {
        type: Boolean,
        default: false,
        index: true
    },
    archived: {
        type: Boolean,
        default: false,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true,
    collection: "threads"
});

// 📊 Indexes for better query performance
ThreadSchema.index({ updatedAt: -1, pinned: -1 });
ThreadSchema.index({ archived: 1, updatedAt: -1 });
ThreadSchema.index({ tags: 1 });

// 🔧 Virtual for message count
ThreadSchema.virtual("messageCount").get(function() {
    return this.messages.length;
});

// 🔧 Virtual for last message
ThreadSchema.virtual("lastMessage").get(function() {
    return this.messages[this.messages.length - 1] || null;
});

// 🔧 Method to add message
ThreadSchema.methods.addMessage = function(role, content, metadata = {}) {
    this.messages.push({
        role,
        content,
        metadata,
        timestamp: new Date()
    });
    this.updatedAt = new Date();
    return this.save();
};

// 🔧 Method to update last message (for editing)
ThreadSchema.methods.updateLastMessage = function(content) {
    if (this.messages.length > 0) {
        const lastMessage = this.messages[this.messages.length - 1];
        lastMessage.content = content;
        lastMessage.metadata.edited = true;
        lastMessage.metadata.editedAt = new Date();
        this.updatedAt = new Date();
        return this.save();
    }
    throw new Error("No messages to update");
};

// 🔧 Method to clear messages
ThreadSchema.methods.clearMessages = function() {
    this.messages = [];
    this.updatedAt = new Date();
    return this.save();
};

// 🔧 Static method to find recent threads
ThreadSchema.statics.findRecent = function(limit = 20, includeArchived = false) {
    const query = includeArchived ? {} : { archived: false };
    return this.find(query)
        .sort({ pinned: -1, updatedAt: -1 })
        .limit(limit)
        .lean();
};

// 🔧 Static method to search threads
ThreadSchema.statics.searchThreads = function(searchQuery, limit = 20) {
    return this.find({
        $or: [
            { title: { $regex: searchQuery, $options: "i" } },
            { "messages.content": { $regex: searchQuery, $options: "i" } },
            { tags: { $in: [searchQuery.toLowerCase()] } }
        ],
        archived: false
    })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();
};

// 🧹 Pre-save middleware
ThreadSchema.pre("save", function(next) {
    this.updatedAt = new Date();
    
    // Auto-generate title from first message if title is default
    if (this.title === "New Chat" && this.messages.length > 0) {
        const firstUserMessage = this.messages.find(m => m.role === "user");
        if (firstUserMessage) {
            this.title = firstUserMessage.content.slice(0, 50);
        }
    }
    
    next();
});

// 📤 Transform output (remove internal fields)
ThreadSchema.set("toJSON", {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model("Thread", ThreadSchema);