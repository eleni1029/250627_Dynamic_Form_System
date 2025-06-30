-- 創建自動分配專案權限的觸發器函數
CREATE OR REPLACE FUNCTION auto_assign_default_projects()
RETURNS TRIGGER AS $$
BEGIN
    -- 為新用戶自動分配所有預設專案權限
    INSERT INTO user_project_permissions (user_id, project_id, granted_by)
    SELECT NEW.id, p.id, 'auto_system'
    FROM projects p 
    WHERE p.project_key IN ('bmi', 'tdee') AND p.is_active = true
    ON CONFLICT (user_id, project_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 創建觸發器：當插入新用戶時自動分配權限
DROP TRIGGER IF EXISTS trigger_auto_assign_projects ON users;
CREATE TRIGGER trigger_auto_assign_projects
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_default_projects();
