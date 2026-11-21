export type ProfessionalReference = {
  id: string;
  title: string;
  organization: string;
  version: string;
  url: string;
  category: 'supervisory' | 'accounting' | 'actuarial-standard' | 'professional-principle' | 'education' | 'market-context';
  topicEn: string;
  topicAr: string;
  moduleEn: string;
  moduleAr: string;
  boundaryEn: string;
  boundaryAr: string;
  accessDate: string;
};

// Titles, versions, URLs, and descriptions were verified against the issuing organizations' pages or PDFs.
// These sources inform education and context; none has reviewed or validated this application's calculations.
export const professionalReferences: ProfessionalReference[] = [
  {
    id: 'iais-icp14', title: 'Insurance Core Principles and Common Framework for the Supervision of Internationally Active Insurance Groups — ICP 14: Valuation', organization: 'International Association of Insurance Supervisors (IAIS)', version: 'December 2024 compilation; revised ICP 14 adopted 5 December 2024', url: 'https://www.iais.org/uploads/2025/06/IAIS-ICPs-and-ComFrame-December-2024.pdf', category: 'supervisory',
    topicEn: 'Supervisory principles for valuing insurer assets and liabilities for solvency purposes, within a total-balance-sheet approach.', topicAr: 'مبادئ إشرافية لتقييم أصول والتزامات شركات التأمين لأغراض الملاءة ضمن نهج الميزانية العمومية الشاملة.',
    moduleEn: 'Reference context for future valuation, technical-provision, and solvency workflows.', moduleAr: 'مرجع سياقي لأدوات التقييم والمخصصات الفنية والملاءة المستقبلية.',
    boundaryEn: 'Supervisory context only. It does not validate SHARQ.RISK formulas, code, mappings, or outputs, and does not make this product compliant or endorsed.', boundaryAr: 'سياق إشرافي فقط. لا يتحقق من معادلات SHARQ.RISK أو شفرته أو ربط بياناته أو مخرجاته، ولا يجعل المنتج ممتثلاً أو معتمداً.', accessDate: '2026-11-21',
  },
  {
    id: 'ifrs17', title: 'IFRS 17 Insurance Contracts', organization: 'International Accounting Standards Board (IASB) / IFRS Foundation', version: 'Issued May 2017; amendments issued June 2020; IFRS Foundation overview labels the standard “Standard 2026 Issued”', url: 'https://www.ifrs.org/issued-standards/list-of-standards/ifrs-17-insurance-contracts/', category: 'accounting',
    topicEn: 'Accounting requirements for insurance contracts in scope, including recognition, measurement, presentation, and disclosure.', topicAr: 'متطلبات المحاسبة لعقود التأمين المشمولة، بما يشمل الاعتراف والقياس والعرض والإفصاح.',
    moduleEn: 'Accounting context for earned-premium and insurance-contract terminology; not a direct source for the demo’s simplified ratios.', moduleAr: 'سياق محاسبي لمصطلحات الأقساط المكتسبة وعقود التأمين؛ وليس مصدراً مباشراً لنسب المثال المبسطة.',
    boundaryEn: 'The standard does not evaluate this application. Applying IFRS 17 requires entity- and contract-specific accounting judgments; this demo is not an IFRS 17 reporting tool.', boundaryAr: 'لا يقيّم المعيار هذا التطبيق. يتطلب تطبيق IFRS 17 أحكاماً محاسبية خاصة بالمنشأة والعقد؛ وهذا المثال ليس أداة لإعداد تقارير IFRS 17.', accessDate: '2026-11-21',
  },
  {
    id: 'asop23', title: 'Actuarial Standard of Practice No. 23 — Data Quality', organization: 'Actuarial Standards Board (ASB)', version: 'Revised Edition; adopted December 2016; effective 30 April 2017; Doc. No. 185', url: 'https://www.actuarialstandardsboard.org/asops/data-quality/', category: 'actuarial-standard',
    topicEn: 'Guidance for actuaries selecting, reviewing, using, and relying on data and communicating significant limitations; it does not require a data audit.', topicAr: 'إرشادات للاكتواريين لاختيار البيانات ومراجعتها واستخدامها والاعتماد عليها والإفصاح عن القيود المهمة؛ ولا تشترط تدقيق البيانات.',
    moduleEn: 'Data Explorer and upload quality workflow reference for profiling, limitations, provenance, and suitability review.', moduleAr: 'مرجع لمستكشف البيانات ومسار جودة الرفع، بما يشمل الفحص والقيود والمصدر ومراجعة الملاءمة.',
    boundaryEn: 'The standard does not certify software or validate dashboard formulas and outputs. Its inclusion is not a claim of compliance.', boundaryAr: 'لا يشهد المعيار على البرامج ولا يتحقق من معادلات لوحة المعلومات ومخرجاتها. إدراجه ليس ادعاءً بالامتثال.', accessDate: '2026-11-21',
  },
  {
    id: 'cas-ratemaking', title: 'Statement of Principles Regarding Property and Casualty Insurance Ratemaking', organization: 'Casualty Actuarial Society (CAS)', version: 'Adopted May 1988; rescinded December 2020; reinstated May 2021 for reference for U.S.-regulated ratemaking', url: 'https://www.casact.org/statement-principles-regarding-property-and-casualty-insurance-ratemaking', category: 'professional-principle',
    topicEn: 'Conceptual principles for prospective P&C ratemaking, including exposure, data, homogeneity, credibility, loss development, trend, catastrophe, reinsurance, classification, and judgment.', topicAr: 'مبادئ مفاهيمية لتسعير الممتلكات والمسؤوليات مستقبلاً، تشمل التعرض والبيانات والتجانس والمصداقية وتطور الخسائر والاتجاه والكوارث وإعادة التأمين والتصنيف والحكم المهني.',
    moduleEn: 'Educational context for future pricing, segmentation, claims trend, and reinsurance modules; the statement is not practice guidance.', moduleAr: 'سياق تعليمي لأدوات التسعير والتقسيم واتجاه المطالبات وإعادة التأمين المستقبلية؛ وليس إرشادات ممارسة.',
    boundaryEn: 'Conceptual reference only. It does not specify or validate any SHARQ.RISK formula, implementation, transformation, or result.', boundaryAr: 'مرجع مفاهيمي فقط. لا يحدد أو يتحقق من أي معادلة أو تنفيذ أو تحويل أو نتيجة في SHARQ.RISK.', accessDate: '2026-11-21',
  },
  {
    id: 'soa-frequency-severity', title: 'Risk and Insurance', organization: 'Education and Examination Committee of the Society of Actuaries (SOA)', version: 'P-21-05, Second Printing; publication date not stated in the verified PDF', url: 'https://www.soa.org/globalassets/assets/files/edu/p-21-05.pdf', category: 'education',
    topicEn: 'Educational definitions of claim frequency and severity and their combination into an overall loss distribution; the note says it is not official SOA or committee opinion or endorsement.', topicAr: 'تعريفات تعليمية لتكرار المطالبات وشدتها ودمجهما في توزيع إجمالي للخسائر؛ وتوضح المذكرة أنها لا تمثل رأياً أو اعتماداً رسمياً من SOA أو اللجنة.',
    moduleEn: 'Claims Intelligence and educational frequency/severity decomposition.', moduleAr: 'ذكاء المطالبات والتحليل التعليمي لتفكيك التكرار والشدة.',
    boundaryEn: 'Educational source for the stated concepts only. It does not validate this dashboard’s calculations, assumptions, code, or results.', boundaryAr: 'مصدر تعليمي للمفاهيم المذكورة فقط. لا يتحقق من حسابات لوحة المعلومات أو افتراضاتها أو شيفرتها أو نتائجها.', accessDate: '2026-11-21',
  },
  {
    id: 'saudi-market-report-2025', title: 'The Saudi Insurance Market Report 2025', organization: 'Insurance Authority (Saudi Arabia)', version: '2025 edition; publication date not stated', url: 'https://www.ia.gov.sa/SectorReports/The%20Saudi%20Insurance%20Market%20Report%202025.pdf', category: 'market-context',
    topicEn: 'Official sector-level discussion of the Saudi insurance market, including premiums, line mix, profitability, solvency, investment, reinsurance, competition, and consumer outcomes.', topicAr: 'عرض رسمي على مستوى القطاع لسوق التأمين السعودي، يشمل الأقساط ومزيج الفروع والربحية والملاءة والاستثمار وإعادة التأمين والمنافسة ونتائج المستهلكين.',
    moduleEn: 'Potential market-context source for future Saudi-market comparisons when definitions and periods align. Its figures are not used in the synthetic demo.', moduleAr: 'مصدر محتمل للسياق والمقارنة السوقية السعودية مستقبلاً عند توافق التعريفات والفترات. لا تُستخدم أرقامه في المثال الاصطناعي.',
    boundaryEn: 'The report is not evidence that synthetic SHARQ.RISK data represent Saudi insurers or market conditions. It does not validate dashboard formulas or implementation.', boundaryAr: 'لا يثبت التقرير أن بيانات SHARQ.RISK الاصطناعية تمثل شركات أو ظروف سوق التأمين السعودي. ولا يتحقق من معادلات لوحة المعلومات أو تنفيذها.', accessDate: '2026-11-21',
  },
];

export const referenceCategoryLabels: Record<ProfessionalReference['category'], { en: string; ar: string }> = {
  supervisory: { en: 'Supervisory reference', ar: 'مرجع إشرافي' },
  accounting: { en: 'Accounting standard', ar: 'معيار محاسبي' },
  'actuarial-standard': { en: 'Actuarial standard of practice', ar: 'معيار ممارسة اكتوارية' },
  'professional-principle': { en: 'Professional principles', ar: 'مبادئ مهنية' },
  education: { en: 'Educational material', ar: 'مادة تعليمية' },
  'market-context': { en: 'Official market context', ar: 'سياق سوقي رسمي' },
};
