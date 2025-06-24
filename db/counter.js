import { mongoose } from './mongoose.js';

const CounterSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true
    },
    seq: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true,
    collection: 'Counters'
  }
);

const Counter = mongoose.model('Counter', CounterSchema);

export default Counter;
