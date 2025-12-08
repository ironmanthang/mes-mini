const SupplierService = require('../services/supplierService');

exports.getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await SupplierService.getAllSuppliers();
    res.status(200).json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await SupplierService.getSupplierById(req.params.id);
    res.status(200).json(supplier);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.createSupplier = async (req, res) => {
  try {
    const supplier = await SupplierService.createSupplier(req.body);
    res.status(201).json(supplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await SupplierService.updateSupplier(req.params.id, req.body);
    res.status(200).json(supplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    await SupplierService.deleteSupplier(req.params.id);
    res.status(200).json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


exports.getSupplierComponents = async (req, res) => {
  try {
    const components = await SupplierService.getSupplierComponents(req.params.id);
    res.status(200).json(components);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.assignComponent = async (req, res) => {
  try {
    const { componentId } = req.body;
    await SupplierService.assignComponentToSupplier(req.params.id, componentId);
    res.status(200).json({ message: 'Component assigned to supplier successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.removeComponent = async (req, res) => {
  try {
    const { componentId } = req.params; // Note: componentId is in URL for delete
    await SupplierService.removeComponentFromSupplier(req.params.id, componentId);
    res.status(200).json({ message: 'Component removed from supplier' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
