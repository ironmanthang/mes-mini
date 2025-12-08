const ComponentService = require('../services/componentService');

exports.getAllComponents = async (req, res) => {
  try {
    const components = await ComponentService.getAllComponents(req.query);
    res.status(200).json(components);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getComponentById = async (req, res) => {
  try {
    const component = await ComponentService.getComponentById(req.params.id);
    res.status(200).json(component);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.createComponent = async (req, res) => {
  try {
    const component = await ComponentService.createComponent(req.body);
    res.status(201).json(component);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateComponent = async (req, res) => {
  try {
    const component = await ComponentService.updateComponent(req.params.id, req.body);
    res.status(200).json(component);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteComponent = async (req, res) => {
  try {
    await ComponentService.deleteComponent(req.params.id);
    res.status(200).json({ message: 'Component deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getComponentSuppliers = async (req, res) => {
  try {
    const suppliers = await ComponentService.getComponentSuppliers(req.params.id);
    res.status(200).json(suppliers);
  } catch (error) {
    if (error.message === 'Component not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};