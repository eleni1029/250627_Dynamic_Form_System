import { createBMIRoutes } from './routes/bmi.routes';

export const BMI_PROJECT_CONFIG = {
  key: 'bmi',
  name: 'BMI Calculator',
  route: '/api/projects/bmi',
  isActive: true
};

export const registerBMIModule = (app: any): void => {
  const bmiRoutes = createBMIRoutes();
  app.use('/api/projects/bmi', bmiRoutes);
  console.log('✅ BMI module registered');
};

export * from './types/bmi.types';
