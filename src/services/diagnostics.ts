import { goalsService } from './goalsService';

export const runGoalsDiagnostics = async () => {
    console.group('🔍 Running Goals Diagnostics');
    const results: string[] = [];
    const log = (msg: string) => {
        console.log(msg);
        results.push(msg);
    };

    try {
        // 1. Test Creation
        log('1️⃣ Testing Goal Creation...');
        const newGoal = {
            title: 'Diagnostic Goal ' + Date.now(),
            target_value: 1000,
            deadline: '2025-12-31',
            type: 'Individual' as const,
            kpi: 'Receita',
            status: 'Em andamento' as const,
            color: 'bg-[#73c6df]'
        };

        const created = await goalsService.createGoal(newGoal);
        if (!created?.id) throw new Error('Failed to create goal - No ID returned');
        log(`✅ Goal Created: ${created.id}`);

        // 2. Test Reading (Verify it exists)
        log('2️⃣ Testing Goal Retrieval...');
        const allGoals = await goalsService.getGoals();
        const found = allGoals.find(g => g.id === created.id);
        if (!found) throw new Error('Created goal not found in list');
        log('✅ Goal found in list');

        // 3. Test Update
        log('3️⃣ Testing Goal Update...');
        const updated = await goalsService.updateGoal(created.id, { title: 'Diagnostic Goal UPDATED' });
        if (updated.title !== 'Diagnostic Goal UPDATED') throw new Error('Update failed validation');
        log('✅ Goal Updated successfully');

        // 4. Test Deletion
        log('4️⃣ Testing Goal Deletion...');
        await goalsService.deleteGoal(created.id);

        // Verify deletion
        const goalsAfterDelete = await goalsService.getGoals();
        if (goalsAfterDelete.find(g => g.id === created.id)) throw new Error('Goal still exists after delete');
        log('✅ Goal Deleted successfully');

        log('🎉 ALL DIAGNOSTICS PASSED');
        alert('Diagnostics Passed! Check console for details.\n\n' + results.join('\n'));
        return true;

    } catch (error: any) {
        console.error('❌ Diagnostics Failed:', error);
        log(`❌ FAILED: ${error.message || error}`);
        alert('Diagnostics FAILED using RLS fix.\nError: ' + (error.message || JSON.stringify(error)));
        return false;
    } finally {
        console.groupEnd();
    }
};
