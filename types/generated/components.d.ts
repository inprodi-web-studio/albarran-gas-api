import type { Schema, Attribute } from '@strapi/strapi';

export interface CustomerCustomerInfo extends Schema.Component {
  collectionName: 'components_customer_customer_infos';
  info: {
    displayName: 'Customer Info';
  };
  attributes: {
    level: Attribute.Relation<
      'customer.customer-info',
      'oneToOne',
      'api::customer-level.customer-level'
    >;
    stats: Attribute.Component<'customer.stats'>;
  };
}

export interface CustomerStats extends Schema.Component {
  collectionName: 'components_customer_stats';
  info: {
    displayName: 'stats';
  };
  attributes: {
    totalLiters: Attribute.Decimal & Attribute.DefaultTo<0>;
    totalSavings: Attribute.Decimal & Attribute.DefaultTo<0>;
  };
}

export interface PromotionCondition extends Schema.Component {
  collectionName: 'components_promotion_conditions';
  info: {
    displayName: 'Condition';
    description: 'Reglas que determinan si la promoci\u00F3n aplica.';
  };
  attributes: {
    type: Attribute.Enumeration<
      ['weekday', 'birthday', 'specific_date', 'liters_range']
    > &
      Attribute.Required &
      Attribute.DefaultTo<'weekday'>;
    weekday: Attribute.Enumeration<
      [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday'
      ]
    >;
    specificDate: Attribute.Date;
    minLiters: Attribute.Decimal;
    maxLiters: Attribute.Decimal;
    notes: Attribute.String;
  };
}

export interface PromotionReward extends Schema.Component {
  collectionName: 'components_promotion_rewards';
  info: {
    displayName: 'Reward';
    description: 'Beneficios aplicables cuando se cumplen las condiciones.';
  };
  attributes: {
    type: Attribute.Enumeration<
      ['discount_per_liter', 'liters_multiplier', 'fixed_discount']
    > &
      Attribute.Required &
      Attribute.DefaultTo<'discount_per_liter'>;
    value: Attribute.Decimal & Attribute.Required;
    maxValue: Attribute.Decimal;
    notes: Attribute.String;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'customer.customer-info': CustomerCustomerInfo;
      'customer.stats': CustomerStats;
      'promotion.condition': PromotionCondition;
      'promotion.reward': PromotionReward;
    }
  }
}
