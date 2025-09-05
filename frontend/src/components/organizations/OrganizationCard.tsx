;

import { Organization } from '@/types';
import Link from 'next/link';
import Image from 'next/image'

interface OrganizationCardProps {
  organization: Organization;
}

export default function OrganizationCard({ organization }: OrganizationCardProps) {
  return (
    <div className="organizations-card">
      <div className="organizations-card-header">
        <div className="organizations-card-info">
          {organization.avatar ? (
            <Image
              src={organization.avatar}
              alt={organization.name}
              className="organizations-card-avatar"
            />
          ) : (
            <div className="organizations-card-avatar-placeholder">
              <span className="organizations-card-avatar-initial">
                {organization.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="organizations-card-details">
            <h3 className="organizations-card-name">
              {organization.name}
            </h3>
            <p className="organizations-card-slug">
              {organization.slug}
            </p>
          </div>
        </div>
        
        <div className="organizations-card-actions">
          <Link
            href={`/settings/organizations/${organization.slug}`}
            className="organizations-card-manage-link"
          >
            Manage
          </Link>
        </div>
      </div>

      {organization.description && (
        <p className="organizations-card-description">
          {organization.description}
        </p>
      )}

      <div className="organizations-card-stats">
        <div className="organizations-card-stats-group">
          <div className="organizations-card-stat">
            <span className="organizations-card-stat-value">
              {organization.memberCount}
            </span>{' '}
            members
          </div>
          <div className="organizations-card-stat">
            <span className="organizations-card-stat-value">
              {organization.workspaceCount}
            </span>{' '}
            workspaces
          </div>
        </div>
        
        {organization.website && (
          <a
            href={organization.website}
            target="_blank"
            rel="noopener noreferrer"
            className="organizations-card-website-link"
          >
            <svg className="organizations-card-website-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}