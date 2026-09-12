package com.example.moneydi.common;

import com.example.moneydi.asset.*;
import com.example.moneydi.spending.*;
import com.example.moneydi.point.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest({SpendingPlanController.class, PointController.class, AssetController.class})
class ApiContractTest {
    @Autowired MockMvc mvc;
    @MockBean SpendingPlanService spending;
    @MockBean PointService points;
    @MockBean AssetService assets;

    @ParameterizedTest
    @ValueSource(strings = {"paid", "isPaid"})
    void acceptsBothPaidFieldNames(String field) throws Exception {
        mvc.perform(post("/api/spending-plans").contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"보험\",\"amount\":100,\"dueDate\":\"2026-09-12\",\"" + field + "\":true}"))
                .andExpect(status().isOk());
        verify(spending).createPlan(argThat(request -> request.isPaid()));
    }

    @Test void rejectsFractionalAmountsInsteadOfTruncating() throws Exception {
        mvc.perform(post("/api/points/test/add").contentType(MediaType.APPLICATION_JSON)
                .content("{\"amount\":1.5,\"description\":\"test\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
        verifyNoInteractions(points);
    }

    @Test void nonexistentAssetHasActionable404() throws Exception {
        doThrow(new ResourceNotFoundException("자산을 찾을 수 없습니다.")).when(assets).deleteAsset(99L);
        mvc.perform(delete("/api/assets/99")).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("자산을 찾을 수 없습니다."));
    }

    @Test void insufficientPointsHasActionable400() throws Exception {
        when(points.usePoints(anyString(), anyLong(), anyString())).thenThrow(new IllegalArgumentException("포인트가 부족합니다."));
        mvc.perform(post("/api/points/test/use").contentType(MediaType.APPLICATION_JSON)
                .content("{\"amount\":100,\"description\":\"test\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("포인트가 부족합니다."));
    }

    @Test void creatingAssetCannotSetServerOwnedFields() throws Exception {
        mvc.perform(post("/api/assets").contentType(MediaType.APPLICATION_JSON)
                .content("{\"id\":99,\"previousAmount\":999,\"name\":\"test\",\"amount\":10,\"category\":\"SAVINGS\"}"))
                .andExpect(status().isOk());
        verify(assets).saveAsset(argThat(asset -> asset.getId() == null && asset.getPreviousAmount() == 0L));
    }
}
