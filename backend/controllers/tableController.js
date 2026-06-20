const Floor = require('../models/Floor');
const Table = require('../models/Table');

// @desc    Get all floors with their tables
// @route   GET /api/floors
// @access  Private
const getFloorsAndTables = async (req, res) => {
  try {
    const floors = await Floor.find({});
    const floorsWithTables = await Promise.all(floors.map(async (floor) => {
      const tables = await Table.find({ floor: floor._id }).sort('tableNumber');
      return {
        ...floor._doc,
        tables
      };
    }));
    res.json(floorsWithTables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a floor
// @route   POST /api/floors
// @access  Private/Admin
const createFloor = async (req, res) => {
  try {
    const floor = await Floor.create({ name: req.body.name });
    res.status(201).json(floor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a table on a floor
// @route   POST /api/tables
// @access  Private/Admin
const createTable = async (req, res) => {
  const { tableNumber, floor, seats } = req.body;
  try {
    const table = await Table.create({ tableNumber, floor, seats });
    res.status(201).json(table);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update table status (Vacant/Active)
// @route   PUT /api/tables/:id/status
// @access  Private
const updateTableStatus = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (table) {
      table.status = req.body.status || table.status;
      const updatedTable = await table.save();
      
      // Emit socket event for real-time Inverted Table State Engine
      const io = req.app.get('io');
      if (io) {
        io.emit('table_state_changed', { tableId: table._id, status: table.status });
      }
      
      res.json(updatedTable);
    } else {
      res.status(404).json({ message: 'Table not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getFloorsAndTables, createFloor, createTable, updateTableStatus };
