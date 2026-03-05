import { fetchApi } from './client';
import { FinancialDocument, FinancialItem, DocType, DocStatus } from '../../types/supabase';
import { syncProjectBudget } from './projectFinancials';

/**
 * Fetch all financial documents for a project
 */
export async function getFinancialDocuments(projectId: string) {
    return await fetchApi(`/api/projects/${projectId}/financial-documents`);
}

/**
 * Fetch a single financial document by ID with full details
 */
export async function getFinancialDocumentById(id: string) {
    return await fetchApi(`/api/financial-documents/${id}`);
}

/**
 * Create a new financial document with items
 */
export async function createFinancialDocument(
    docData: Partial<FinancialDocument>,
    itemsData: Partial<FinancialItem>[]
) {
    const doc = await fetchApi(`/api/financial-documents`, {
        method: 'POST',
        body: JSON.stringify({
            document: docData,
            items: itemsData
        })
    });

    // Sync budget if approved
    if (docData.project_id) {
        await syncProjectBudget(docData.project_id).catch(err => console.error('Budget sync failed', err));
    }

    return doc;
}

/**
 * Update a financial document and its items
 */
export async function updateFinancialDocument(
    id: string,
    docData: Partial<FinancialDocument>,
    itemsData: Partial<FinancialItem>[]
) {
    await fetchApi(`/api/financial-documents/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            document: docData,
            items: itemsData
        })
    });

    // Sync budget
    // Need projectId, usually available in docData, otherwise we'd need to fetch doc
    if (docData.project_id) {
        await syncProjectBudget(docData.project_id).catch(err => console.error('Budget sync failed', err));
    }

    return true;
}

/**
 * Delete a financial document
 */
export async function deleteFinancialDocument(id: string) {
    // We would ideally want the backend to return the deleted row to know the project_id, 
    // or just fetch it beforehand
    let projectId = null;
    try {
        const doc = await getFinancialDocumentById(id);
        projectId = doc.project_id;
    } catch (e) {
        console.warn('Could not fetch doc before deletion to sync budget');
    }

    await fetchApi(`/api/financial-documents/${id}`, {
        method: 'DELETE',
    });

    // Sync budget
    if (projectId) {
        await syncProjectBudget(projectId).catch(err => console.error('Budget sync failed', err));
    }

    return true;
}

