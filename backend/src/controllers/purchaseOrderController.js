const POService = require('../services/purchaseOrderService');

exports.createPO = async (req, res) => {
  try {
    // req.user.employeeId comes from the 'protect' middleware
    const po = await POService.createPO(req.body, req.user.employeeId);
    res.status(201).json(po);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


exports.updatePO = async (req, res) => {
  try {
    const { id } = req.params;
    const po = await POService.updatePO(id, req.body, req.user.employeeId);
    res.status(200).json(po);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


exports.getAllPOs = async (req, res) => {
  try {
    const list = await POService.getAllPOs();
    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPOById = async (req, res) => {
  try {
    const po = await POService.getPOById(req.params.id);
    res.status(200).json(po);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.approvePO = async (req, res) => {
  try {
    const { id } = req.params;
    // req.user comes from authMiddleware (protect)
    const result = await POService.approvePO(id, req.user.employeeId);
    res.status(200).json({ message: 'Purchase Order Approved', result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};