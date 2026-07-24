import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useAccountingEngine } from "./useAccountingEngine";
import { EducationalStage } from "@/contexts/StageContext";

/**
 * Fee Engine (محرك الرسوم)
 * Handles automatic generation of student fees, applying fee structures,
 * discounts, and waivers.
 */
export function useFeeEngine() {
  const globalStore = useGlobalStore();
  const { postAutomaticEntry } = useAccountingEngine();

  /**
   * Generates standard enrollment fees for a student based on their stage and the active fee structure
   */
  const generateEnrollmentFees = (
    studentId: string, 
    stage: EducationalStage, 
    grade: string, 
    academicYearId: string
  ) => {
    // Find all mandatory fee structures for this stage and grade
    const applicableStructures = (globalStore.activeStageFeeStructures || []).filter(
      (f: any) => f.isMandatory && 
           (f.stage === "all" || f.stage === stage) &&
           (!f.grades || f.grades.length === 0 || f.grades.includes(grade))
    );

    const student = (globalStore.allStudents || []).find((s: any) => s.id === studentId);
    if (!student) return;

    for (const structure of applicableStructures) {
      // Check if structure has installments
      if (structure.installments && structure.installments.length > 0) {
        structure.installments.forEach((installment: any, index: number) => {
          const installmentAmount = structure.amount * (installment.percentage / 100);
          const newInvoiceId = "INV-" + Math.floor(10000 + Math.random() * 90000) + "-" + index;
          
          const invoiceData = {
            id: newInvoiceId,
            studentId,
            academicYearId,
            studentName: student.name,
            title: `${structure.name} - ${installment.name}`,
            amount: installmentAmount,
            paid: 0,
            dueDate: installment.dueDate,
            status: "issued" as const,
            stage: student.stage,
            category: structure.type
          };

          globalStore.addInvoice(invoiceData);

          postAutomaticEntry(
            `إثبات استحقاق ${structure.name} (${installment.name}) على الطالب ${student.name}`,
            newInvoiceId,
            "invoice",
            "gl-ar-students",
            structure.type === 'transport' ? "gl-rev-transport" : "gl-rev-tuition", 
            installmentAmount,
            academicYearId
          );
        });
      } else {
        // Create single invoice
        const newInvoiceId = "INV-" + Math.floor(10000 + Math.random() * 90000);
        
        const invoiceData = {
          id: newInvoiceId,
          studentId,
          academicYearId,
          studentName: student.name,
          title: structure.name,
          amount: structure.amount,
          paid: 0,
          dueDate: new Date().toISOString().split('T')[0],
          status: "issued" as const,
          stage: student.stage,
          category: structure.type
        };

        globalStore.addInvoice(invoiceData);

        postAutomaticEntry(
          `إثبات استحقاق رسوم (${structure.name}) على الطالب ${student.name}`,
          newInvoiceId,
          "invoice",
          "gl-ar-students", 
          structure.type === 'transport' ? "gl-rev-transport" : "gl-rev-tuition", 
          structure.amount,
          academicYearId
        );
      }
    }
  };

  /**
   * Apply a discount or grant to an existing invoice
   */
  const applyDiscount = (invoiceId: string, discountId: string) => {
    const invoice = (globalStore.allInvoices || []).find((i: any) => i.id === invoiceId);
    const discount = (globalStore.allDiscounts || []).find((d: any) => d.id === discountId);
    
    if (!invoice || !discount) throw new Error("الفاتورة أو الخصم غير موجود");

    const discountAmount = discount.type === "percentage" 
      ? invoice.amount * (discount.value / 100)
      : discount.value;

    const netAmount = invoice.amount - discountAmount;

    globalStore.updateInvoice(invoiceId, {
      discountId,
      discountAmount,
      netAmount
    });

    const academicYearId = invoice.academicYearId || (globalStore.allAcademicYears || []).find((y: any) => y.isCurrent)?.id || "AY-1";
    
    postAutomaticEntry(
      `تطبيق خصم (${discount.name}) على فاتورة الطالب ${invoice.studentName}`,
      invoice.id,
      "invoice",
      "gl-exp-discount", // Debit
      "gl-ar-students", // Credit
      discountAmount,
      academicYearId
    );
  };

  return {
    generateEnrollmentFees,
    applyDiscount
  };
}
