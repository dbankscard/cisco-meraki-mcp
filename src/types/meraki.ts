// Comprehensive Meraki API type definitions

import { BaseDevice } from "./common.js";

// Organization Types
export interface Organization {
  id: string;
  name: string;
  url: string;
  api?: {
    enabled: boolean;
  };
  licensing?: {
    model: "co-term" | "per-device" | "subscription";
  };
  cloud?: {
    region?: {
      name: string;
    };
  };
}

export interface OrganizationLicense {
  licenseId: string;
  licensedDeviceSerial?: string;
  licenseType: string;
  licenseKey?: string;
  orderNumber?: string;
  deviceSerial?: string;
  durationInDays?: number;
  expirationDate?: string;
  headLicenseId?: string;
  totalDurationInDays?: number;
  state: "active" | "expired" | "expiring" | "unused" | "unusedActive" | "recentlyQueued";
  seatCount?: number;
  claimedAt?: string;
  activatedAt?: string;
  permanentlyQueuedAt?: string;
  editions?: Array<{
    edition: string;
    productType: string;
  }>;
}

// Network Types
export interface Network {
  id: string;
  organizationId: string;
  name: string;
  productTypes: Array<"appliance" | "switch" | "wireless" | "systemsManager" | "camera" | "cellularGateway" | "sensor">;
  timeZone: string;
  tags?: string[];
  enrollmentString?: string;
  url?: string;
  notes?: string;
  isBoundToConfigTemplate?: boolean;
  configTemplateId?: string;
}

export interface NetworkClient {
  id: string;
  mac: string;
  ip?: string;
  ip6?: string;
  description?: string;
  firstSeen?: string;
  lastSeen?: string;
  manufacturer?: string;
  os?: string;
  user?: string;
  vlan?: string;
  switchport?: string;
  wirelessCapabilities?: string;
  smInstalled?: boolean;
  ssid?: string;
  status?: "Online" | "Offline";
  notes?: string;
  usage?: {
    sent: number;
    recv: number;
  };
  namedVlan?: string;
  adaptivePolicyGroup?: string;
  deviceTypePrediction?: string;
}

// Device Types
export interface Device extends BaseDevice {
  networkId?: string;
  firmware?: string;
  floorPlanId?: string;
  lanIp?: string;
  wan1Ip?: string;
  wan2Ip?: string;
  url?: string;
  beaconIdParams?: {
    uuid?: string;
    major?: number;
    minor?: number;
  };
  details?: Array<{
    name: string;
    value: string;
  }>;
}

export interface DeviceUplink {
  interface: string;
  status: "active" | "ready" | "failed" | "not connected";
  ip?: string;
  gateway?: string;
  publicIp?: string;
  dns?: string;
  usingStaticIp?: boolean;
  vlan?: number;
  highAvailability?: {
    enabled: boolean;
    role?: "primary" | "secondary";
  };
}

// Appliance Types
export interface ApplianceVpnStatus {
  networkId: string;
  networkName: string;
  merakiVpnPeers?: Array<{
    networkId: string;
    networkName: string;
    reachability: string;
  }>;
  thirdPartyVpnPeers?: Array<{
    name: string;
    publicIp: string;
    reachability: string;
  }>;
}

export interface ApplianceFirewallRule {
  comment?: string;
  policy: "allow" | "deny";
  protocol: "tcp" | "udp" | "icmp" | "any";
  srcPort?: string;
  srcCidr: string;
  destPort?: string;
  destCidr: string;
  syslogEnabled?: boolean;
}

// Switch Types
export interface SwitchPort {
  portId: string;
  name?: string;
  tags?: string[];
  enabled?: boolean;
  poeEnabled?: boolean;
  type?: "trunk" | "access";
  vlan?: number;
  voiceVlan?: number;
  allowedVlans?: string;
  isolationEnabled?: boolean;
  rstpEnabled?: boolean;
  stpGuard?: "disabled" | "root guard" | "bpdu guard" | "loop guard";
  linkNegotiation?: string;
  portScheduleId?: string;
  udld?: "Alert only" | "Enforce";
  accessPolicyType?: "Open" | "Custom access policy" | "MAC allow list" | "Sticky MAC allow list";
  accessPolicyNumber?: number;
  macAllowList?: string[];
  stickyMacAllowList?: string[];
  stickyMacAllowListLimit?: number;
  stormControlEnabled?: boolean;
  adaptivePolicyGroupId?: string;
  peerSgtCapable?: boolean;
  flexibleStackingEnabled?: boolean;
  daiTrusted?: boolean;
  profile?: {
    enabled?: boolean;
    id?: string;
    iname?: string;
  };
}

export interface SwitchStack {
  id: string;
  name?: string;
  serials: string[];
  createdAt: string;
  networkId: string;
}

// Wireless Types
export interface WirelessSsid {
  number: number;
  name: string;
  enabled: boolean;
  splashPage?: "None" | "Click-through splash page" | "Billing" | "Password-protected with Meraki RADIUS" | 
               "Password-protected with custom RADIUS" | "Password-protected with Active Directory" | 
               "Password-protected with LDAP" | "SMS authentication" | "Systems Manager Sentry" | 
               "Facebook Wi-Fi" | "Google OAuth" | "Sponsored guest" | "Cisco ISE";
  ssidAdminAccessible?: boolean;
  authMode: "open" | "open-enhanced" | "psk" | "open-with-radius" | "open-with-nac" | "8021x-meraki" | 
            "8021x-nac" | "8021x-radius" | "8021x-google" | "8021x-entra" | "8021x-localradius" | "ipsk-with-radius" | "ipsk-without-radius";
  psk?: string;
  encryptionMode?: "wep" | "wpa";
  wpaEncryptionMode?: "WPA1 only" | "WPA1 and WPA2" | "WPA2 only" | "WPA3 Transition Mode" | "WPA3 only" | "WPA3 192-bit Security";
  radiusServers?: Array<{
    host: string;
    port: number;
    secret?: string;
    radsecEnabled?: boolean;
    openRoamingCertificateId?: number;
    caCertificate?: string;
  }>;
  radiusAccountingEnabled?: boolean;
  radiusAccountingServers?: Array<{
    host: string;
    port: number;
    secret?: string;
    radsecEnabled?: boolean;
    caCertificate?: string;
  }>;
  ipAssignmentMode?: "NAT mode" | "Bridge mode" | "Layer 3 roaming" | "Ethernet over GRE" | "Layer 3 roaming with a concentrator" | "VPN";
  useVlanTagging?: boolean;
  concentratorNetworkId?: string;
  secondaryConcentratorNetworkId?: string;
  disassociateClientsOnVpnFailover?: boolean;
  vlanId?: number;
  defaultVlanId?: number;
  apTagsAndVlanIds?: Array<{
    tags: string[];
    vlanId: number;
  }>;
  walledGardenEnabled?: boolean;
  walledGardenRanges?: string[];
  gre?: {
    concentrator?: {
      host: string;
    };
    key?: number;
  };
  radiusOverride?: boolean;
  radiusGuestVlanEnabled?: boolean;
  radiusGuestVlanId?: number;
  minBitrate?: number;
  bandSelection?: "Dual band operation" | "5 GHz band only" | "Dual band operation with Band Steering";
  perClientBandwidthLimitUp?: number;
  perClientBandwidthLimitDown?: number;
  perSsidBandwidthLimitUp?: number;
  perSsidBandwidthLimitDown?: number;
  lanIsolationEnabled?: boolean;
  visible?: boolean;
  availableOnAllAps?: boolean;
  availabilityTags?: string[];
  mandatoryDhcpEnabled?: boolean;
  adultContentFilteringEnabled?: boolean;
  dnsRewrite?: {
    enabled?: boolean;
    dnsCustomNameservers?: string[];
  };
  speedBurst?: {
    enabled?: boolean;
  };
  namedVlans?: {
    tagging?: {
      enabled?: boolean;
      defaultVlanName?: string;
      byApTags?: Array<{
        tags: string[];
        vlanName: string;
      }>;
    };
    radius?: {
      guestVlan?: {
        enabled?: boolean;
        name?: string;
      };
    };
  };
}

export interface WirelessRfProfile {
  id: string;
  networkId: string;
  name: string;
  clientBalancingEnabled?: boolean;
  minBitrateType?: "band" | "ssid";
  bandSelectionType?: "ap" | "ssid";
  apBandSettings?: {
    bandOperationMode?: "dual" | "2.4ghz" | "5ghz" | "6ghz" | "dual-with-6ghz";
    bandSteeringEnabled?: boolean;
    bands?: {
      enabled?: string[];
    };
  };
  twoFourGhzSettings?: {
    maxPower?: number;
    minPower?: number;
    minBitrate?: number;
    validAutoChannels?: number[];
    axEnabled?: boolean;
    rxsop?: number;
  };
  fiveGhzSettings?: {
    maxPower?: number;
    minPower?: number;
    minBitrate?: number;
    validAutoChannels?: number[];
    channelWidth?: "auto" | "20" | "40" | "80" | "160";
    rxsop?: number;
  };
  sixGhzSettings?: {
    maxPower?: number;
    minPower?: number;
    minBitrate?: number;
    validAutoChannels?: number[];
    channelWidth?: "auto" | "20" | "40" | "80" | "160";
    rxsop?: number;
  };
  transmission?: {
    enabled?: boolean;
  };
  perSsidSettings?: {
    [key: string]: {
      minBitrate?: number;
      bandOperationMode?: "dual" | "2.4ghz" | "5ghz" | "6ghz" | "dual-with-6ghz";
      bandSteeringEnabled?: boolean;
      bands?: {
        enabled?: string[];
      };
    };
  };
  flexRadios?: {
    byModel?: Array<{
      model: string;
      bands?: string[];
    }>;
  };
}

// Camera Types
export interface CameraQualityProfile {
  id: string;
  name: string;
  networkId: string;
  videoSettings?: {
    MV12?: {
      quality?: "Standard" | "Enhanced" | "High";
      resolution?: string;
    };
    MV12WE?: {
      quality?: "Standard" | "Enhanced" | "High";
      resolution?: string;
    };
    MV13?: {
      quality?: "Standard" | "Enhanced" | "High";
      resolution?: string;
    };
    MV13M?: {
      quality?: "Standard" | "Enhanced" | "High";
      resolution?: string;
    };
    MV21?: {
      quality?: "Standard" | "Enhanced" | "High";
      resolution?: string;
    };
    MV22?: {
      quality?: "Standard" | "Enhanced" | "High";
      resolution?: string;
    };
    MV32?: {
      quality?: "Standard" | "Enhanced" | "High";
      resolution?: string;
    };
    MV33?: {
      quality?: "Standard" | "Enhanced" | "High";
      resolution?: string;
    };
    MV52?: {
      quality?: "Standard" | "Enhanced" | "High";
      resolution?: string;
    };
    MV63?: {
      quality?: "Standard" | "Enhanced" | "High";
      resolution?: string;
    };
    MV63M?: {
      quality?: "Standard" | "Enhanced" | "High";
      resolution?: string;
    };
    MV63X?: {
      quality?: "Standard" | "Enhanced" | "High";
      resolution?: string;
    };
    MV72?: {
      quality?: "Standard" | "Enhanced" | "High";
      resolution?: string;
    };
    MV73?: {
      quality?: "Standard" | "Enhanced" | "High";
      resolution?: string;
    };
    MV93?: {
      quality?: "Standard" | "Enhanced" | "High";
      resolution?: string;
    };
    MV93M?: {
      quality?: "Standard" | "Enhanced" | "High";
      resolution?: string;
    };
    MV93X?: {
      quality?: "Standard" | "Enhanced" | "High";
      resolution?: string;
    };
  };
}

export interface CameraAnalyticsZone {
  id: string;
  type: "line" | "polygon";
  label?: string;
  regionOfInterest?: {
    x0: string;
    y0: string;
    x1: string;
    y1: string;
  };
  vertices?: Array<{
    x: string;
    y: string;
  }>;
}

// Systems Manager Types
export interface SystemsManagerDevice {
  id: string;
  serial?: string;
  wifiMac?: string;
  name?: string;
  systemModel?: string;
  uuid?: string;
  serialNumber?: string;
  hasChromeMdm?: boolean;
  osName?: string;
  systemType?: string;
  availableDeviceCapacity?: number;
  kioskAppName?: string;
  biosVersion?: string;
  totalStorageCapacity?: number;
  perimeterDateTime?: string;
  isManaged?: boolean;
  ownerEmail?: string;
  ownerUsername?: string;
  publicIp?: string;
  phoneNumber?: string;
  imei?: string;
  iccid?: string;
  isSupervised?: boolean;
  depProfileAssignedDate?: string;
  depProfileAssignedBy?: string;
  depProfileIsPushed?: boolean;
  depProfilePushedDate?: string;
  depProfilePushFailed?: boolean;
  depProfileName?: string;
  deviceCapacity?: string;
  carrierSettingsVersion?: string;
  currentCarrierNetwork?: string;
  currentMobileCountryCode?: string;
  currentMobileNetworkCode?: string;
  simCarrierNetwork?: string;
  subscriberCarrierNetwork?: string;
  cellularDataUsed?: string;
  isRoaming?: boolean;
  subscriberMobileCountryCode?: string;
  subscriberMobileNetworkCode?: string;
  dataRoamingEnabled?: boolean;
  deviceModel?: string;
  securityPatchVersion?: string;
  androidPatchVersion?: string;
  firmwareVersion?: string;
  isCloudBackupEnabled?: boolean;
  isActivationLockEnabled?: boolean;
  isEncrypted?: boolean;
  isDeviceLocatorServiceEnabled?: boolean;
  isDoNotDisturbInEffect?: boolean;
  personalHotspotEnabled?: boolean;
  itunesStoreAccountIsActive?: boolean;
  androidSecurityPatchVersion?: string;
}

export interface SystemsManagerApp {
  id: string;
  appId?: string;
  name: string;
  identifier?: string;
  bundleSize?: number;
  createdAt?: string;
  status?: string;
  version?: string;
  shortVersion?: string;
  isDynamicSize?: boolean;
  dynamicSize?: number;
}