const formatRG = (rg) => {
  if (!rg) return '-';
  return rg.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3');
};

export default formatRG;