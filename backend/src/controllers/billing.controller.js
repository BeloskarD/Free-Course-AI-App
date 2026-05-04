import User from '../models/User.js';
import billingService from '../services/billing.service.js';

class BillingController {
  async getPlans(req, res, next) {
    try {
      res.json({ success: true, data: billingService.getPlanCatalog() });
    } catch (error) {
      next(error);
    }
  }

  async createCheckoutSession(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      const source = req.body?.source || 'pricing_page';
      const session = await billingService.createCheckoutSession(user, source);
      res.json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }

  async createPortalSession(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      const session = await billingService.createPortalSession(user);
      res.json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }

  async getSubscription(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      const summary = await billingService.getSubscriptionSummary(user);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req, res, next) {
    try {
      const signature = req.headers['stripe-signature'];
      if (!signature) {
        return res.status(400).json({ success: false, message: 'Missing Stripe signature' });
      }

      const event = await billingService.verifyWebhookEvent(signature, req.body);
      await billingService.handleWebhookEvent(event);
      res.json({ received: true });
    } catch (error) {
      error.statusCode = error.statusCode || 400;
      next(error);
    }
  }
}

export default new BillingController();
