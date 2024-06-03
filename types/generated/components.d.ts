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

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'customer.customer-info': CustomerCustomerInfo;
      'customer.stats': CustomerStats;
    }
  }
}
