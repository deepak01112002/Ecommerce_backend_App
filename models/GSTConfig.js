const mongoose = require('mongoose');

const gstConfigSchema = new mongoose.Schema({
    // GST Rate Configuration
    gstRates: [{
        rate: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        applicableCategories: [String],
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    
    // HSN Code Configuration
    hsnCodes: [{
        code: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        gstRate: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        category: String,
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    
    // Company GST Details
    companyGSTDetails: {
        gstin: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format']
        },
        legalName: {
            type: String,
            required: true,
            trim: true
        },
        tradeName: String,
        address: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            pincode: { type: String, required: true },
            country: { type: String, default: 'India' }
        },
        stateCode: {
            type: String,
            required: true,
            length: 2
        },
        registrationDate: Date,
        gstType: {
            type: String,
            enum: ['regular', 'composition', 'casual', 'non_resident'],
            default: 'regular'
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    
    // Tax Calculation Rules
    taxRules: {
        // Inter-state vs Intra-state
        interStateTax: {
            type: String,
            enum: ['IGST'],
            default: 'IGST'
        },
        intraStateTax: {
            type: String,
            enum: ['CGST_SGST'],
            default: 'CGST_SGST'
        },
        
        // Reverse Charge Mechanism
        reverseChargeThreshold: {
            type: Number,
            default: 0
        },
        
        // TDS/TCS Configuration
        tdsApplicable: {
            type: Boolean,
            default: false
        },
        tdsRate: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        tcsApplicable: {
            type: Boolean,
            default: false
        },
        tcsRate: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    },
    
    // Invoice Configuration
    invoiceConfig: {
        invoicePrefix: {
            type: String,
            default: 'INV',
            trim: true
        },
        invoiceNumberFormat: {
            type: String,
            default: 'YYYYMM####',
            trim: true
        },
        financialYearStart: {
            type: Number,
            default: 4, // April
            min: 1,
            max: 12
        },
        dueDays: {
            type: Number,
            default: 30,
            min: 0
        },
        lateFeePercentage: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    
    // Compliance Settings
    complianceSettings: {
        gstr1FilingFrequency: {
            type: String,
            enum: ['monthly', 'quarterly'],
            default: 'monthly'
        },
        gstr3bFilingFrequency: {
            type: String,
            enum: ['monthly', 'quarterly'],
            default: 'monthly'
        },
        annualReturnRequired: {
            type: Boolean,
            default: true
        },
        auditRequired: {
            type: Boolean,
            default: false
        },
        auditThreshold: {
            type: Number,
            default: 10000000 // 1 Crore
        }
    },
    
    // E-way Bill Configuration
    ewayBillConfig: {
        threshold: {
            type: Number,
            default: 50000
        },
        isEnabled: {
            type: Boolean,
            default: true
        },
        validityDays: {
            type: Number,
            default: 1
        }
    },
    
    // Last Updated
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
gstConfigSchema.index({ 'companyGSTDetails.gstin': 1 });
gstConfigSchema.index({ 'hsnCodes.code': 1 });
gstConfigSchema.index({ 'gstRates.rate': 1 });

// Static method to get current GST configuration
gstConfigSchema.statics.getCurrentConfig = async function() {
    let config = await this.findOne().sort({ createdAt: -1 });
    
    if (!config) {
        // Create default configuration
        config = await this.create({
            gstRates: [
                { rate: 0, description: 'Nil Rate', isActive: true },
                { rate: 5, description: 'Essential Items', isActive: true },
                { rate: 12, description: 'Standard Items', isActive: true },
                { rate: 18, description: 'Most Items', isActive: true },
                { rate: 28, description: 'Luxury Items', isActive: true }
            ],
            hsnCodes: [
                { code: '9999', description: 'Other miscellaneous items', gstRate: 18, isActive: true }
            ],
            companyGSTDetails: {
                gstin: '29ABCDE1234F1Z5',
                legalName: 'Ghanshyam Murti Bhandar',
                address: {
                    street: 'Shop Address',
                    city: 'City',
                    state: 'State',
                    pincode: '000000'
                },
                stateCode: '00'
            }
        });
    }
    
    return config;
};

// Static method to get GST rate by HSN code
gstConfigSchema.statics.getGSTRateByHSN = async function(hsnCode) {
    const config = await this.getCurrentConfig();
    const hsn = config.hsnCodes.find(h => h.code === hsnCode && h.isActive);
    return hsn ? hsn.gstRate : 18; // Default 18%
};

// Static method to calculate GST
gstConfigSchema.statics.calculateGST = async function(amount, gstRate, fromState, toState) {
    const isInterState = fromState !== toState;
    const gstAmount = (amount * gstRate) / 100;
    
    if (isInterState) {
        return {
            cgst: 0,
            sgst: 0,
            igst: gstAmount,
            totalGST: gstAmount
        };
    } else {
        return {
            cgst: gstAmount / 2,
            sgst: gstAmount / 2,
            igst: 0,
            totalGST: gstAmount
        };
    }
};

// Instance method to update company details
gstConfigSchema.methods.updateCompanyDetails = function(details) {
    this.companyGSTDetails = { ...this.companyGSTDetails, ...details };
    this.lastUpdated = new Date();
    return this.save();
};

// Instance method to add HSN code
gstConfigSchema.methods.addHSNCode = function(hsnData) {
    const existingHSN = this.hsnCodes.find(h => h.code === hsnData.code);
    if (existingHSN) {
        throw new Error('HSN code already exists');
    }
    
    this.hsnCodes.push(hsnData);
    this.lastUpdated = new Date();
    return this.save();
};

// Instance method to update HSN code
gstConfigSchema.methods.updateHSNCode = function(code, updateData) {
    const hsnIndex = this.hsnCodes.findIndex(h => h.code === code);
    if (hsnIndex === -1) {
        throw new Error('HSN code not found');
    }
    
    this.hsnCodes[hsnIndex] = { ...this.hsnCodes[hsnIndex], ...updateData };
    this.lastUpdated = new Date();
    return this.save();
};

// Instance method to get active GST rates
gstConfigSchema.methods.getActiveGSTRates = function() {
    return this.gstRates.filter(rate => rate.isActive);
};

// Instance method to get active HSN codes
gstConfigSchema.methods.getActiveHSNCodes = function() {
    return this.hsnCodes.filter(hsn => hsn.isActive);
};

module.exports = mongoose.model('GSTConfig', gstConfigSchema);
