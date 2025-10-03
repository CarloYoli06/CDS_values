import mongoose from 'mongoose';

const ztpriceshistory = new mongoose.Schema({
    ID: { type: Number, required: true },
    DATE: { type: Date },
    OPEN: { type: Number },
    HIGH: { type: Number },
    LOW: { type: Number },
    CLOSE: { type: Number },
    VOLUME: { type: Number }
});

export default mongoose.model(
    "ZTPRICESHISTORY",
    ztpriceshistory,
    "ZTPRICESHISTORY"
);